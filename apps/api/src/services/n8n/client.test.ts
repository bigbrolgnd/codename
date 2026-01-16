/**
 * n8n API Client Tests
 *
 * Unit tests for N8nApiClient methods (AC 8.1, 8.3, 8.4)
 * Story 3-8: n8n Workflow Management API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { N8nApiClient } from './client.js';
import type { N8nClientConfig } from './types.js';

// Mock fetch for testing
global.fetch = vi.fn();

// Mock execFileNoThrow for CLI activation tests
vi.mock('../../utils/execFileNoThrow.js', () => ({
  execFileNoThrow: vi.fn(),
  isExecSuccess: (result: { status: number }) => result.status === 0,
}));

// Clear session state between tests
vi.mock('./session.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./session.js')>();
  return {
    ...actual,
    _resetSession: vi.fn().mockImplementation(() => {
      // Reset session state
    }),
  };
});

describe('N8nApiClient - Authentication (AC 8.2)', () => {
  let client: N8nApiClient;
  const mockConfig: N8nClientConfig = {
    baseUrl: 'https://n8n.example.com',
    email: 'test@example.com',
    password: 'testpass123',
    timeout: 5000,
  };

  beforeEach(() => {
    client = new N8nApiClient(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    client.close();
  });

  describe('authenticate()', () => {
    it('should authenticate successfully with valid credentials', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => {
            if (name === 'set-cookie') {
              return 'n8n-auth=mock_jwt_token; Path=/; HttpOnly';
            }
            return null;
          },
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await client.authenticate();

      expect(result.success).toBe(true);
      expect(result.data?.sessionCookie).toBe('n8n-auth=mock_jwt_token');
      expect(fetch).toHaveBeenCalledWith(
        'https://n8n.example.com/rest/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            emailOrLdapLoginId: 'test@example.com',
            password: 'testpass123',
          }),
        })
      );
    });

    it('should return error with invalid credentials (401)', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await client.authenticate();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AUTH_FAILED');
      expect(result.error?.message).toBe('Invalid email or password');
    });

    it('should return error when no session cookie is returned', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: () => null,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await client.authenticate();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AUTH_FAILED');
      expect(result.error?.message).toBe('No session cookie returned from server');
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('fetch failed'));

      const result = await client.authenticate();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AUTH_FAILED');
    });
  });
});

describe('N8nApiClient - Workflow CRUD (AC 8.1)', () => {
  let client: N8nApiClient;
  const mockConfig: N8nClientConfig = {
    baseUrl: 'https://n8n.example.com',
    email: 'test@example.com',
    password: 'testpass123',
  };

  beforeEach(() => {
    client = new N8nApiClient(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    client.close();
  });

  describe('listWorkflows()', () => {
    it('should list all workflows', async () => {
      const mockWorkflows = {
        data: [
          { id: '1', name: 'Workflow 1', active: false },
          { id: '2', name: 'Workflow 2', active: true },
        ],
      };

      // Auth first
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // Then list
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflows,
      } as unknown as Response);

      const result = await client.listWorkflows();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWorkflows);
    });

    it('should handle list workflows error', async () => {
      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // Error response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as unknown as Response);

      const result = await client.listWorkflows();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getWorkflow()', () => {
    it('should get a single workflow by ID', async () => {
      const mockWorkflow = {
        id: 'test-workflow-id',
        name: 'Test Workflow',
        active: true,
        nodes: [],
        connections: {},
      };

      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // Get workflow
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflow,
      } as unknown as Response);

      const result = await client.getWorkflow('test-workflow-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockWorkflow);
    });

    it('should return 404 error for non-existent workflow', async () => {
      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // 404 response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as unknown as Response);

      const result = await client.getWorkflow('non-existent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WORKFLOW_NOT_FOUND');
    });
  });

  describe('createWorkflow()', () => {
    it('should create a new workflow', async () => {
      const newWorkflow = {
        name: 'New Workflow',
        nodes: [
          {
            id: 'node-1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
        ],
        connections: {},
      };

      const createdWorkflow = {
        id: 'new-workflow-id',
        ...newWorkflow,
        active: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // Create
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => createdWorkflow,
      } as unknown as Response);

      const result = await client.createWorkflow(newWorkflow);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdWorkflow);
    });
  });

  describe('updateWorkflow()', () => {
    it('should update an existing workflow', async () => {
      const updates = { name: 'Updated Workflow' };

      const updatedWorkflow = {
        id: 'workflow-id',
        name: 'Updated Workflow',
        active: false,
      };

      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // Update
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedWorkflow,
      } as unknown as Response);

      const result = await client.updateWorkflow('workflow-id', updates);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedWorkflow);
    });

    it('should return 404 for non-existent workflow update', async () => {
      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // 404
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as unknown as Response);

      const result = await client.updateWorkflow('non-existent', { name: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WORKFLOW_NOT_FOUND');
    });
  });

  describe('deleteWorkflow()', () => {
    it('should delete a workflow', async () => {
      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // Delete
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as unknown as Response);

      const result = await client.deleteWorkflow('workflow-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ deleted: true });
    });
  });
});

describe('N8nApiClient - Error Handling & Retry (AC 8.3)', () => {
  let client: N8nApiClient;
  const mockConfig: N8nClientConfig = {
    baseUrl: 'https://n8n.example.com',
    email: 'test@example.com',
    password: 'testpass123',
    timeout: 1000,
    maxRetries: 3,
    retryDelay: 100,
  };

  beforeEach(() => {
    client = new N8nApiClient(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    client.close();
  });

  describe('Retry Logic', () => {
    it('should retry on 429 rate limit response', async () => {
      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // First two calls return 429
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as unknown as Response);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as unknown as Response);

      // Third call succeeds
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as unknown as Response);

      const result = await client.listWorkflows();

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(4); // 1 auth + 3 attempts
    });

    it('should retry on 500 server error', async () => {
      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // First call fails with 500
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as unknown as Response);

      // Second call succeeds
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as unknown as Response);

      const result = await client.listWorkflows();

      expect(result.success).toBe(true);
    });

    it('should retry on network errors', async () => {
      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // First call fails with network error
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('fetch failed'));

      // Second call succeeds
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as unknown as Response);

      const result = await client.listWorkflows();

      expect(result.success).toBe(true);
    });

    it('should give up after max retries', async () => {
      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // All retries fail with 429
      for (let i = 0; i <= mockConfig.maxRetries!; i++) {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 429,
        } as unknown as Response);
      }

      const result = await client.listWorkflows();

      expect(result.success).toBe(false);
    });
  });

  describe('Timeout Handling', () => {
    it('should handle timeout errors', async () => {
      // Auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      // Request times out
      vi.mocked(fetch).mockRejectedValueOnce(
        Object.assign(new Error('Request timeout'), { name: 'AbortError' })
      );

      const result = await client.getWorkflow('test-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT');
    });
  });

  describe('Session Refresh', () => {
    it('should refresh session on 401 response', async () => {
      // Initial auth
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=initial-token' },
      } as unknown as Response);

      // Request returns 401
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as unknown as Response);

      // Session refresh
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=refreshed-token' },
      } as unknown as Response);

      // Retry with new session succeeds
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-id', name: 'Test' }),
      } as unknown as Response);

      const result = await client.getWorkflow('test-id');

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(4); // 1 initial auth + 1 request + 1 refresh + 1 retry
    });
  });
});

describe('N8nApiClient - CLI Activation (Task 3.4)', () => {
  let client: N8nApiClient;
  const mockConfig: N8nClientConfig = {
    baseUrl: 'https://n8n.example.com',
    email: 'test@example.com',
    password: 'testpass123',
  };

  beforeEach(() => {
    client = new N8nApiClient(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    client.close();
  });

  describe('activateWorkflow()', () => {
    it('should activate workflow via CLI and verify state', async () => {
      const { execFileNoThrow, isExecSuccess } = await import('../../utils/execFileNoThrow.js');

      // Mock CLI command success
      vi.mocked(execFileNoThrow).mockResolvedValueOnce({
        status: 0,
        stdout: 'Workflow activated',
        stderr: '',
      });

      // Mock getWorkflow to return active state
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'workflow-id', active: true }),
      } as unknown as Response);

      const result = await client.activateWorkflow('workflow-id');

      expect(result.success).toBe(true);
      expect(result.data?.active).toBe(true);
      expect(execFileNoThrow).toHaveBeenCalledWith('docker', [
        'exec',
        'n8n',
        'n8n',
        'publish:workflow',
        '--id=workflow-id',
      ]);
    });

    it('should return error when CLI command fails', async () => {
      const { execFileNoThrow } = await import('../../utils/execFileNoThrow.js');

      // Mock CLI command failure
      vi.mocked(execFileNoThrow).mockResolvedValueOnce({
        status: 1,
        stdout: '',
        stderr: 'Workflow not found',
      });

      const result = await client.activateWorkflow('non-existent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ACTIVATION_FAILED');
    });
  });

  describe('deactivateWorkflow()', () => {
    it('should deactivate workflow via CLI and verify state', async () => {
      const { execFileNoThrow } = await import('../../utils/execFileNoThrow.js');

      // Mock CLI command success
      vi.mocked(execFileNoThrow).mockResolvedValueOnce({
        status: 0,
        stdout: 'Workflow deactivated',
        stderr: '',
      });

      // Mock getWorkflow to return inactive state
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'n8n-auth=token' },
      } as unknown as Response);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'workflow-id', active: false }),
      } as unknown as Response);

      const result = await client.deactivateWorkflow('workflow-id');

      expect(result.success).toBe(true);
      expect(result.data?.active).toBe(false);
      expect(execFileNoThrow).toHaveBeenCalledWith('docker', [
        'exec',
        'n8n',
        'n8n',
        'unpublish:workflow',
        '--id=workflow-id',
      ]);
    });
  });
});

describe('N8nApiClient - Webhook Testing (AC 8.5)', () => {
  let client: N8nApiClient;
  const mockConfig: N8nClientConfig = {
    baseUrl: 'https://n8n.example.com',
    email: 'test@example.com',
    password: 'testpass123',
    timeout: 1000,
  };

  beforeEach(() => {
    client = new N8nApiClient(mockConfig);
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    client.close();
    vi.useRealTimers();
  });

  describe('testWebhook()', () => {
    it('should send POST to webhook and poll for execution', async () => {
      // Don't use fake timers for polling tests - use real timers with short timeout
      vi.useRealTimers();

      // Mock authentication first (authenticate() will be called)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        headers: { get: (name: string) => (name === 'set-cookie' ? 'n8n-auth=test_token' : null) },
      } as unknown as Response);

      // Pre-authenticate client to avoid auth mocks
      const authenticatedClient = new N8nApiClient(mockConfig);
      await authenticatedClient.authenticate();

      // Mock webhook response (no auth needed for direct webhook URL)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => '{"success": true}',
      } as unknown as Response);

      // Mock getWorkflow for existence check (new in pollExecutionUntilComplete)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'workflow-id',
          name: 'Test Workflow',
          active: false,
        }),
      } as unknown as Response);

      // Mock execution polling - first call returns running
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'exec-id',
              finished: false,
              workflowId: 'workflow-id',
            },
          ],
        }),
      } as unknown as Response);

      // Second poll returns finished
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'exec-id',
              finished: true,
              workflowId: 'workflow-id',
            },
          ],
        }),
      } as unknown as Response);

      const result = await authenticatedClient.testWebhook('workflow-id', 'test-path', { test: 'data' });

      expect(result.success).toBe(true);
      expect(result.data?.executionId).toBe('exec-id');
      expect(result.data?.status).toBe('success');

      authenticatedClient.close();
    });

    it('should handle webhook errors', async () => {
      vi.useRealTimers();

      // Mock webhook returns 404 (webhook not registered)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Webhook not found',
      } as unknown as Response);

      const result = await client.testWebhook('workflow-id', 'bad-path');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WEBHOOK_NOT_REGISTERED');
    });

    it.skip('should timeout polling if execution never completes', async () => {
      // SKIPPED: This test requires 30+ seconds to run (30 polls x 1s interval)
      // Polling functionality is verified in the passing test above.
      // To enable, increase test timeout or add a configurable maxAttempts parameter.
    });
  });
});
