/**
 * n8n API Client
 *
 * Main client for n8n REST API with:
 * - Programmatic authentication
 * - Cookie persistence for session management
 * - Automatic retry with exponential backoff
 * - Error handling for common scenarios
 * - CLI fallback for activation (REST API limitation)
 */

import type {
  N8nClientConfig,
  N8nWorkflow,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  WorkflowListResponse,
  ActivateWorkflowResponse,
  N8nExecution,
  WebhookTestResponse,
  Result,
  N8nErrorCode,
  N8nApiError,
} from './types.js';
import {
  getSessionCookie,
  setSession,
  parseSessionCookie,
  formatSessionCookie,
  refreshSessionIfNeeded,
  clearSession as clearSessionState,
  isSessionValid,
} from './session.js';
import { execFileNoThrow, isExecSuccess } from '../../utils/execFileNoThrow.js';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_TIMEOUT = 120000; // 120 seconds (n8n operations can be slow)
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second base delay
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// ============================================================================
// Main Client Class
// ============================================================================

export class N8nApiClient {
  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly dockerContainerName: string;
  private isAuthenticated = false;

  constructor(config: N8nClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.email = config.email;
    this.password = config.password;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelay = config.retryDelay ?? DEFAULT_RETRY_DELAY;
    this.dockerContainerName = config.dockerContainerName ?? 'n8n';
  }

  // ========================================================================
  // Authentication
  // ========================================================================

  /**
   * Authenticate with n8n and store session cookie
   */
  async authenticate(): Promise<Result<{ sessionCookie: string }>> {
    try {
      const response = await this.fetch('/rest/login', {
        method: 'POST',
        body: JSON.stringify({
          emailOrLdapLoginId: this.email,
          password: this.password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: {
              code: 'AUTH_FAILED',
              message: 'Invalid email or password',
            },
          };
        }
        throw new Error(`Login failed with status ${response.status}`);
      }

      const setCookieHeader = response.headers.get('set-cookie');
      const sessionCookie = parseSessionCookie(setCookieHeader);

      if (!sessionCookie) {
        return {
          success: false,
          error: {
            code: 'AUTH_FAILED',
            message: 'No session cookie returned from server',
          },
        };
      }

      // Set session with 24 hour expiry
      setSession(sessionCookie, 24 * 60 * 60 * 1000);
      this.isAuthenticated = true;

      return {
        success: true,
        data: { sessionCookie: formatSessionCookie(sessionCookie) },
      };
    } catch (error) {
      return this.handleError(error, 'AUTH_FAILED');
    }
  }

  /**
   * Ensure authenticated before making requests
   */
  private async ensureAuthenticated(): Promise<void> {
    if (this.isAuthenticated && isSessionValid()) {
      return;
    }

    const result = await this.authenticate();
    if (!result.success) {
      throw new Error(`Authentication failed: ${result.error?.message}`);
    }
  }

  /**
   * Refresh session on 401 response
   */
  private async handleSessionRefresh(statusCode: number): Promise<void> {
    const session = await refreshSessionIfNeeded(statusCode, () => this.authenticateInternal());
    if (session) {
      this.isAuthenticated = true;
    }
  }

  /**
   * Internal authentication without recursive checks
   */
  private async authenticateInternal(): Promise<{ cookie: string; expiresAt: Date }> {
    const response = await this.fetch('/rest/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrLdapLoginId: this.email,
        password: this.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    const setCookieHeader = response.headers.get('set-cookie');
    const sessionCookie = parseSessionCookie(setCookieHeader);

    if (!sessionCookie) {
      throw new Error('No session cookie returned from server');
    }

    return {
      cookie: formatSessionCookie(sessionCookie),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  // ========================================================================
  // HTTP Client with Session Management
  // ========================================================================

  /**
   * Fetch with automatic session management and retry logic
   */
  private async fetch(
    path: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    // Add session cookie if authenticated
    if (this.isAuthenticated && isSessionValid()) {
      headers['Cookie'] = getSessionCookie();
    }

    // Set default headers
    if (!headers['Content-Type'] && options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, requestOptions);

      // Handle session refresh on 401
      if (response.status === 401 && !path.endsWith('/login')) {
        await this.handleSessionRefresh(401);

        // Retry with fresh session
        if (retryCount === 0) {
          return this.fetch(path, options, retryCount + 1);
        }
      }

      // Retry on server errors or rate limits
      if (RETRY_STATUS_CODES.includes(response.status) && retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetch(path, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (retryCount < this.maxRetries && this.isNetworkError(error)) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetch(path, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Check if error is a network error (should retry)
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError) {
      // Common network error messages
      const networkMessages = [
        'fetch failed',
        'network error',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
      ];
      return networkMessages.some((msg) => error.message.includes(msg));
    }
    return false;
  }

  // ========================================================================
  // Workflow CRUD Operations
  // ========================================================================

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<Result<WorkflowListResponse>> {
    try {
      await this.ensureAuthenticated();

      const response = await this.fetch('/rest/workflows');

      if (!response.ok) {
        throw new Error(`Failed to list workflows: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return this.handleError(error, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Get a single workflow by ID
   */
  async getWorkflow(id: string): Promise<Result<N8nWorkflow>> {
    try {
      await this.ensureAuthenticated();

      const response = await this.fetch(`/rest/workflows/${id}`);

      if (response.status === 404) {
        return {
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: `Workflow with ID "${id}" not found`,
          },
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to get workflow: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return this.handleError(error, 'WORKFLOW_NOT_FOUND');
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(request: CreateWorkflowRequest): Promise<Result<N8nWorkflow>> {
    try {
      await this.ensureAuthenticated();

      const response = await this.fetch('/rest/workflows', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return this.handleError(error, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: string, request: UpdateWorkflowRequest): Promise<Result<N8nWorkflow>> {
    try {
      await this.ensureAuthenticated();

      const response = await this.fetch(`/rest/workflows/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(request),
      });

      if (response.status === 404) {
        return {
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: `Workflow with ID "${id}" not found`,
          },
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to update workflow: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return this.handleError(error, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<Result<{ deleted: boolean }>> {
    try {
      await this.ensureAuthenticated();

      const response = await this.fetch(`/rest/workflows/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 404) {
        return {
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: `Workflow with ID "${id}" not found`,
          },
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.status}`);
      }

      return {
        success: true,
        data: { deleted: true },
      };
    } catch (error) {
      return this.handleError(error, 'UNKNOWN_ERROR');
    }
  }

  // ========================================================================
  // Workflow Activation (CLI-ONLY)
  // ========================================================================

  /**
   * Activate a workflow (CLI-ONLY)
   *
   * ⚠️ CLI-ONLY POLICY: REST API activation does NOT work in n8n.
   * This method uses n8n CLI commands exclusively.
   *
   * @param id - Workflow ID
   * @returns Result with activation status
   */
  async activateWorkflow(id: string): Promise<Result<ActivateWorkflowResponse>> {
    // CLI-ONLY: Directly use CLI activation (REST API doesn't work)
    return this.activateViaCli(id, true);
  }

  /**
   * Deactivate a workflow (CLI-ONLY)
   *
   * ⚠️ CLI-ONLY POLICY: REST API activation does NOT work in n8n.
   * This method uses n8n CLI commands exclusively.
   *
   * @param id - Workflow ID
   * @returns Result with activation status
   */
  async deactivateWorkflow(id: string): Promise<Result<ActivateWorkflowResponse>> {
    // CLI-ONLY: Directly use CLI deactivation (REST API doesn't work)
    return this.activateViaCli(id, false);
  }

  /**
   * Activate/deactivate workflow via CLI (CLI-ONLY method)
   *
   * ⚠️ CLI-ONLY POLICY: This is the ONLY working method for workflow activation.
   * Uses `docker exec n8n n8n publish:workflow` or `unpublish:workflow`
   *
   * @param id - Workflow ID
   * @param activate - true to activate, false to deactivate
   * @returns Result with activation status
   */
  private async activateViaCli(
    id: string,
    activate: boolean
  ): Promise<Result<ActivateWorkflowResponse>> {
    try {
      // n8n CLI uses "publish" for activation and "unpublish" for deactivation
      const command = activate ? 'publish:workflow' : 'unpublish:workflow';

      // Use execFileNoThrow for safe command execution (prevents shell injection)
      const result = await execFileNoThrow('docker', [
        'exec',
        this.dockerContainerName,
        'n8n',
        command,
        `--id=${id}`,
      ]);

      if (!isExecSuccess(result)) {
        return {
          success: false,
          error: {
            code: 'ACTIVATION_FAILED',
            message: `CLI ${activate ? 'activation' : 'deactivation'} failed`,
            details: result.stderr,
          },
        };
      }

      // Verify activation state by fetching workflow
      const getResult = await this.getWorkflow(id);

      if (getResult.success && getResult.data) {
        const isActuallyActive = getResult.data.active;

        if (isActuallyActive === activate) {
          return {
            success: true,
            data: { id, active: isActuallyActive },
          };
        }

        // CLI succeeded but state didn't change
        return {
          success: false,
          error: {
            code: 'ACTIVATION_FAILED',
            message: `CLI ${activate ? 'activation' : 'deactivation'} succeeded but workflow state is ${isActuallyActive ? 'active' : 'inactive'}`,
          },
        };
      }

      // Couldn't verify state
      return {
        success: false,
        error: {
          code: 'ACTIVATION_FAILED',
          message: 'Failed to verify workflow state after CLI call',
        },
      };
    } catch (error) {
      return this.handleError(error, 'UNKNOWN_ERROR');
    }
  }

  // ========================================================================
  // Executions
  // ========================================================================

  /**
   * Get executions for a workflow
   */
  async getExecutions(workflowId: string, limit = 10): Promise<Result<N8nExecution[]>> {
    try {
      await this.ensureAuthenticated();

      const response = await this.fetch(
        `/rest/executions?workflowId=${workflowId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get executions: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return this.handleError(error, 'UNKNOWN_ERROR');
    }
  }

  /**
   * Get a single execution by ID
   */
  async getExecution(id: string): Promise<Result<N8nExecution>> {
    try {
      await this.ensureAuthenticated();

      const response = await this.fetch(`/rest/executions/${id}`);

      if (response.status === 404) {
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: `Execution with ID "${id}" not found`,
          },
        };
      }

      if (!response.ok) {
        throw new Error(`Failed to get execution: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      return this.handleError(error, 'UNKNOWN_ERROR');
    }
  }

  // ========================================================================
  // Webhook Testing
  // ========================================================================

  /**
   * Poll execution status until completion or timeout
   * @param workflowId - Workflow ID to poll
   * @param maxAttempts - Maximum polling attempts (default: 30)
   * @param interval - Polling interval in ms (default: 1000)
   * @returns Result with execution data or timeout error
   */
  private async pollExecutionUntilComplete(
    workflowId: string,
    maxAttempts = 30,
    interval = 1000
  ): Promise<Result<N8nExecution>> {
    // Verify workflow exists first (prevents polling non-existent workflow)
    const workflowResult = await this.getWorkflow(workflowId);
    if (!workflowResult.success) {
      return {
        success: false,
        error: {
          code: 'WORKFLOW_NOT_FOUND',
          message: `Cannot poll executions: workflow "${workflowId}" not found`,
        },
      };
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const executionsResult = await this.getExecutions(workflowId, 1);

      // If no executions yet and this is the first attempt, wait and retry
      if (!executionsResult.success || !executionsResult.data || executionsResult.data.length === 0) {
        // Distinguish between "no executions yet" vs "error"
        if (!executionsResult.success) {
          return {
            success: false,
            error: executionsResult.error,
          };
        }

        // No executions yet - wait for webhook to be called
        await new Promise((resolve) => setTimeout(resolve, interval));
        continue;
      }

      const execution = executionsResult.data[0];

      // Check if execution is finished or errored
      if (execution.finished || execution.error) {
        return {
          success: true,
          data: execution,
        };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    // Timeout - return last known execution state
    const finalResult = await this.getExecutions(workflowId, 1);
    if (finalResult.success && finalResult.data && finalResult.data.length > 0) {
      return {
        success: true,
        data: finalResult.data[0],
      };
    }

    return {
      success: false,
      error: {
        code: 'TIMEOUT',
        message: `Execution did not complete within ${maxAttempts * interval}ms`,
      },
    };
  }

  /**
   * Test a workflow webhook by sending a POST request
   * Note: This sends the request directly to the webhook URL, not via REST API
   * Polls execution status until completion (AC 4.3)
   */
  async testWebhook(
    workflowId: string,
    webhookPath: string,
    payload: Record<string, unknown> = {}
  ): Promise<Result<WebhookTestResponse>> {
    try {
      // Send request to webhook URL
      const webhookUrl = `${this.baseUrl}/webhook/${webhookPath}`;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeout),
      });

      const responseBody = await response.text();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'WEBHOOK_NOT_REGISTERED',
            message: `Webhook test failed: ${response.status} ${response.statusText}`,
            details: responseBody,
          },
        };
      }

      // Poll for execution completion (AC 4.3)
      const execResult = await this.pollExecutionUntilComplete(workflowId, 30, 1000);

      if (!execResult.success) {
        return {
          success: false,
          error: execResult.error,
        };
      }

      const execution = execResult.data!;

      // Return detailed results (AC 4.4)
      return {
        success: true,
        data: {
          executionId: execution.id,
          status: execution.error ? 'error' : execution.finished ? 'success' : 'running',
          result: execution,
        },
      };
    } catch (error) {
      return this.handleError(error, 'WEBHOOK_NOT_REGISTERED');
    }
  }

  // ========================================================================
  // Error Handling
  // ========================================================================

  /**
   * Convert unknown errors to Result with appropriate error code
   */
  private handleError(error: unknown, defaultCode: N8nErrorCode): Result<never> {
    if (error instanceof Error) {
      // Log error for debugging (AC 6.5)
      console.error('[N8nApiClient] Error:', {
        code: defaultCode,
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      // Check for timeout
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out',
            details: error.message,
          },
        };
      }

      // Check for network errors
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error occurred',
            details: error.message,
          },
        };
      }

      // Generic error
      return {
        success: false,
        error: {
          code: defaultCode,
          message: error.message,
        },
      };
    }

    // Log unknown errors
    console.error('[N8nApiClient] Unknown error:', error);

    return {
      success: false,
      error: {
        code: defaultCode,
        message: 'Unknown error occurred',
        details: error,
      },
    };
  }

  /**
   * Close the client and clear session
   */
  close(): void {
    clearSessionState();
    this.isAuthenticated = false;
  }
}
