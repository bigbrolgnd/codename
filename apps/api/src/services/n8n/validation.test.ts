/**
 * n8n Workflow Validation Tests
 *
 * Unit tests for workflow validation logic (AC 8.6)
 * Story 3-8: n8n Workflow Management API
 */

import { describe, it, expect } from 'vitest';
import {
  validateWorkflow,
  validateWorkflowResult,
  validateConnectionStructure,
  validateNodeTypes,
  validateNodeConfigs,
  NODE_TYPE_PREFIXES,
  CORE_NODE_TYPES,
} from './validation.js';
import type { N8nWorkflow, N8nConnections, N8nNode } from './types.js';

describe('Workflow Validation', () => {
  describe('validateWorkflow()', () => {
    it('should validate a correct workflow', () => {
      const workflow = {
        nodes: [
          {
            id: 'node-1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
            webhookId: 'webhook-123',
          },
          {
            id: 'node-2',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 1,
            position: [450, 300],
            parameters: { url: 'https://example.com' },
          },
        ],
        connections: {
          'node-1': {
            main: [
              [
                {
                  node: 'node-2',
                  type: 'main',
                  index: 0,
                },
              ],
            ],
          },
        },
      };

      const result = validateWorkflow(workflow);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject workflow with no nodes', () => {
      const workflow = {
        nodes: [],
        connections: {},
      };

      const result = validateWorkflow(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('NO_NODES');
    });

    it('should reject workflow with no connections object', () => {
      const workflow = {
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
        connections: undefined as unknown as N8nConnections,
      };

      const result = validateWorkflow(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('NO_CONNECTIONS');
    });
  });

  describe('validateConnectionStructure() - AC 5.3', () => {
    it('should accept 2D connection array (correct format)', () => {
      const connections = {
        'node-1': {
          main: [
            [
              {
                node: 'node-2',
                type: 'main',
                index: 0,
              },
            ],
          ],
        },
      };

      const errors = validateConnectionStructure(connections);

      expect(errors).toHaveLength(0);
    });

    it('should reject 3D connection array (critical bug)', () => {
      const connections = {
        'node-1': {
          main: [
            [
              [
                {
                  node: 'node-2',
                  type: 'main',
                  index: 0,
                },
              ],
            ],
          ],
        },
      };

      const errors = validateConnectionStructure(connections);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBe('INVALID_CONNECTIONS');
      expect(errors[0].message).toContain('3D connection array');
      expect(errors[0].severity).toBe('error');
    });

    it('should reject missing connection properties', () => {
      const connections = {
        'node-1': {
          main: [
            [
              {
                node: 'node-2',
                // Missing type
                index: 0,
              } as unknown as { node: string; index: number },
            ],
          ],
        },
      };

      const errors = validateConnectionStructure(connections);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.message.includes('missing "type"'))).toBe(true);
    });

    it('should reject connections to non-existent nodes', () => {
      const connections = {
        'node-1': {
          main: [
            [
              {
                node: 'ghost-node', // Does not exist
                type: 'main',
                index: 0,
              },
            ],
          ],
        },
      };

      const nodes = [
        { id: 'node-1', name: 'Node 1', type: 'n8n-nodes-base.webhook', typeVersion: 1, position: [0, 0], parameters: {} },
      ];

      const errors = validateNodeConfigs(nodes, connections);

      expect(errors.some((e) => e.code === 'INVALID_CONNECTION_TARGET')).toBe(true);
    });
  });

  describe('validateNodeTypes() - AC 5.2', () => {
    it('should accept valid n8n node types', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {},
        },
      ];

      const errors = validateNodeTypes(nodes);

      expect(errors).toHaveLength(0);
    });

    it('should reject duplicate node IDs', () => {
      const nodes = [
        {
          id: 'duplicate-id',
          name: 'Node 1',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {},
        },
        {
          id: 'duplicate-id',
          name: 'Node 2',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 1,
          position: [450, 300],
          parameters: {},
        },
      ];

      const errors = validateNodeTypes(nodes);

      expect(errors.some((e) => e.code === 'DUPLICATE_NODE_ID')).toBe(true);
    });

    it('should reject missing node type', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'No Type',
          type: '' as unknown as string,
          typeVersion: 1,
          position: [250, 300],
          parameters: {},
        },
      ];

      const errors = validateNodeTypes(nodes);

      expect(errors.some((e) => e.code === 'INVALID_NODE_TYPE')).toBe(true);
    });

    it('should warn about unknown node types (community nodes)', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'Community Node',
          type: 'custom-community-node',
          typeVersion: 1,
          position: [250, 300],
          parameters: {},
        },
      ];

      const errors = validateNodeTypes(nodes);

      expect(errors.some((e) => e.code === 'UNKNOWN_NODE_TYPE')).toBe(true);
      expect(errors.find((e) => e.code === 'UNKNOWN_NODE_TYPE')?.severity).toBe('warning');
    });

    it('should reject invalid typeVersion', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'Bad Version',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 0,
          position: [250, 300],
          parameters: {},
        },
      ];

      const errors = validateNodeTypes(nodes);

      expect(errors.some((e) => e.code === 'INVALID_TYPE_VERSION')).toBe(true);
    });

    it('should reject invalid position format', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'Bad Position',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250] as [number], // Missing Y coordinate
          parameters: {},
        },
      ];

      const errors = validateNodeTypes(nodes);

      expect(errors.some((e) => e.code === 'INVALID_POSITION')).toBe(true);
    });
  });

  describe('validateNodeConfigs() - AC 5.2', () => {
    it('should require webhookId for webhook nodes', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {},
        },
      ];

      const connections = {};
      const errors = validateNodeConfigs(nodes, connections);

      expect(errors.some((e) => e.code === 'MISSING_WEBHOOK_ID')).toBe(true);
    });

    it('should require URL for HTTP request nodes', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'HTTP',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 1,
          position: [250, 300],
          parameters: {},
        },
      ];

      const connections = {};
      const errors = validateNodeConfigs(nodes, connections);

      expect(errors.some((e) => e.code === 'MISSING_URL')).toBe(true);
    });

    it('should warn about code nodes with no code', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'Code',
          type: 'n8n-nodes-base.code',
          typeVersion: 1,
          position: [250, 300],
          parameters: {},
        },
      ];

      const connections = {};
      const errors = validateNodeConfigs(nodes, connections);

      expect(errors.some((e) => e.code === 'MISSING_CODE')).toBe(true);
      expect(errors.find((e) => e.code === 'MISSING_CODE')?.severity).toBe('warning');
    });

    it('should pass validation for properly configured webhook node', () => {
      const nodes = [
        {
          id: 'node-1',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {},
          webhookId: 'webhook-123',
        },
      ];

      const connections = {};
      const errors = validateNodeConfigs(nodes, connections);

      expect(errors.some((e) => e.code === 'MISSING_WEBHOOK_ID')).toBe(false);
    });
  });
});

describe('validateWorkflowResult() - API Wrapper', () => {
  it('should return Result type for API consistency', () => {
    const workflow = {
      nodes: [
        {
          id: 'node-1',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {},
          webhookId: 'webhook-123',
        },
      ],
      connections: {},
    };

    const result = validateWorkflowResult(workflow);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('data');
    expect(result.success).toBe(true);
    expect(result.data?.valid).toBe(true);
  });

  it('should return success: false for invalid workflow', () => {
    const workflow = {
      nodes: [],
      connections: {},
    };

    const result = validateWorkflowResult(workflow);

    expect(result.success).toBe(false);
    expect(result.data?.valid).toBe(false);
  });
});

describe('Exports - Testing Constants', () => {
  it('should export known node type prefixes', () => {
    expect(NODE_TYPE_PREFIXES).toContain('@n8n/n8n-nodes-');
    expect(NODE_TYPE_PREFIXES).toContain('n8n-nodes-base.');
  });

  it('should export core node types', () => {
    expect(CORE_NODE_TYPES).toContain('n8n-nodes-base.webhook');
    expect(CORE_NODE_TYPES).toContain('n8n-nodes-base.httpRequest');
  });
});
