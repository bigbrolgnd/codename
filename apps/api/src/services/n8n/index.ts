/**
 * n8n Service Facade
 *
 * Public API for n8n workflow management service.
 * Exports high-level functions for workflow operations.
 */

import { N8nApiClient } from './client.js';
import type {
  N8nClientConfig,
  Result,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  N8nNode,
  N8nConnections,
} from './types.js';

// ============================================================================
// Client Configuration
// ============================================================================

function getClientConfig(): N8nClientConfig {
  const baseUrl = process.env.N8N_API_URL || 'https://n8n.b2ainvestments.com';
  const email = process.env.N8N_ADMIN_EMAIL || '';
  const password = process.env.N8N_ADMIN_PASSWORD || '';

  if (!email || !password) {
    throw new Error(
      'N8N_ADMIN_EMAIL and N8N_ADMIN_PASSWORD environment variables are required'
    );
  }

  return {
    baseUrl,
    email,
    password,
    timeout: 120000, // 2 minutes (n8n operations can be slow)
    maxRetries: 3,
    retryDelay: 1000,
  };
}

// ============================================================================
// Client Instance (Singleton)
// ============================================================================

let clientInstance: N8nApiClient | null = null;

function getClient(): N8nApiClient {
  if (!clientInstance) {
    const config = getClientConfig();
    clientInstance = new N8nApiClient(config);
  }
  return clientInstance;
}

// ============================================================================
// Public API - Authentication
// ============================================================================

/**
 * Authenticate with n8n and store session
 */
export async function authenticate(): Promise<Result<{ sessionCookie: string }>> {
  const client = getClient();
  return client.authenticate();
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  if (clientInstance) {
    clientInstance.close();
    clientInstance = null;
  }
}

// ============================================================================
// Public API - Workflow Operations
// ============================================================================

/**
 * List all workflows
 */
export async function listWorkflows(): Promise<Result<{ workflows: unknown[] }>> {
  const client = getClient();
  const result = await client.listWorkflows();

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error,
    } as Result<{ workflows: unknown[] }>;
  }

  return {
    success: true,
    data: { workflows: result.data.data || [] },
  };
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflow(id: string) {
  const client = getClient();
  return client.getWorkflow(id);
}

/**
 * Create a new workflow
 */
export async function createWorkflow(data: CreateWorkflowRequest) {
  const client = getClient();
  return client.createWorkflow(data);
}

/**
 * Update an existing workflow
 */
export async function updateWorkflow(id: string, data: UpdateWorkflowRequest) {
  const client = getClient();
  return client.updateWorkflow(id, data);
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string) {
  const client = getClient();
  return client.deleteWorkflow(id);
}

// ============================================================================
// Public API - Workflow Activation
// ============================================================================

/**
 * Activate a workflow
 */
export async function activateWorkflow(id: string) {
  const client = getClient();
  return client.activateWorkflow(id);
}

/**
 * Deactivate a workflow
 */
export async function deactivateWorkflow(id: string) {
  const client = getClient();
  return client.deactivateWorkflow(id);
}

// ============================================================================
// Public API - Executions
// ============================================================================

/**
 * Get executions for a workflow
 */
export async function getExecutions(workflowId: string, limit = 10) {
  const client = getClient();
  return client.getExecutions(workflowId, limit);
}

/**
 * Get a single execution by ID
 */
export async function getExecution(id: string) {
  const client = getClient();
  return client.getExecution(id);
}

// ============================================================================
// Public API - Webhook Testing
// ============================================================================

/**
 * Test a workflow webhook
 */
export async function testWebhook(
  workflowId: string,
  webhookPath: string,
  payload?: Record<string, unknown>
) {
  const client = getClient();
  return client.testWebhook(workflowId, webhookPath, payload);
}

// ============================================================================
// Public API - Validation
// ============================================================================

/**
 * Validate workflow structure before import
 */
export async function validateWorkflow(workflow: {
  nodes: N8nNode[];
  connections: N8nConnections;
}) {
  const { validateWorkflowResult } = await import('./validation.js');
  return validateWorkflowResult(workflow);
}

// ============================================================================
// Re-export Types
// ============================================================================

export * from './types.js';
export { N8nApiClient } from './client.js';
export {
  getSession,
  setSession,
  clearSession as clearSessionState,
  isSessionValid,
} from './session.js';
export * from './validation.js';
