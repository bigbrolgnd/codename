/**
 * n8n Workflow Validation
 *
 * Validates workflow structure before import to prevent errors.
 * Detects common issues like 3D connection arrays, invalid node types, etc.
 *
 * Story 3-8: n8n Workflow Management API
 */

import type {
  N8nWorkflow,
  N8nNode,
  N8nConnections,
  WorkflowValidationError,
  WorkflowValidationResult,
  Result,
} from './types.js';

// ============================================================================
// Known Node Types (from n8n base nodes)
// ============================================================================

/**
 * Common n8n node type prefixes
 * Full list would be extensive - we validate format, not exhaustive list
 */
const NODE_TYPE_PREFIXES = [
  '@n8n/n8n-nodes-',
  'n8n-nodes-base.',
  '@n8n-js/',
] as const;

/**
 * Core node types that must exist
 */
const CORE_NODE_TYPES = [
  'n8n-nodes-base.manualTrigger',
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.httpRequest',
  'n8n-nodes-base.code',
  'n8n-nodes-base.if',
  'n8n-nodes-base.switch',
  'n8n-nodes-base.merge',
  'n8n-nodes-base.splitInBatches',
  'n8n-nodes-base.set',
] as const;

// ============================================================================
// Connection Structure Validation (AC 5.3)
// ============================================================================

/**
 * Validate connection structure is 2D array, not 3D
 *
 * CRITICAL: n8n requires 2D array format for connections.
 * 3D arrays cause "Cannot read properties of undefined (reading 'disabled')" errors.
 *
 * Correct: [[{...}]]
 * Wrong: [[[{...}]]]
 */
function validateConnectionStructure(
  connections: N8nConnections
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];

  for (const [nodeName, nodeConnections] of Object.entries(connections)) {
    // Check main connections
    if (nodeConnections.main) {
      if (!Array.isArray(nodeConnections.main)) {
        errors.push({
          code: 'INVALID_CONNECTIONS',
          message: `Node "${nodeName}" main connections must be an array`,
          node: nodeName,
          field: 'connections.main',
          severity: 'error',
        });
        continue;
      }

      // Check each output index
      for (let outputIndex = 0; outputIndex < nodeConnections.main.length; outputIndex++) {
        const connectionsArray = nodeConnections.main[outputIndex];

        if (!Array.isArray(connectionsArray)) {
          errors.push({
            code: 'INVALID_CONNECTIONS',
            message: `Node "${nodeName}" output ${outputIndex} connections must be an array`,
            node: nodeName,
            field: `connections.main[${outputIndex}]`,
            severity: 'error',
          });
          continue;
        }

        // Check for 3D array (the critical bug)
        if (connectionsArray.length > 0 && Array.isArray(connectionsArray[0])) {
          errors.push({
            code: 'INVALID_CONNECTIONS',
            message: `Node "${nodeName}" output ${outputIndex} has 3D connection array. Must be 2D: [[{node, type, index}]]`,
            node: nodeName,
            field: `connections.main[${outputIndex}]`,
            severity: 'error',
          });
        }

        // Validate connection object structure
        for (let i = 0; i < connectionsArray.length; i++) {
          const conn = connectionsArray[i];
          if (!conn || typeof conn !== 'object') {
            errors.push({
              code: 'INVALID_CONNECTIONS',
              message: `Node "${nodeName}" connection ${i} must be an object`,
              node: nodeName,
              field: `connections.main[${outputIndex}][${i}]`,
              severity: 'error',
            });
            continue;
          }

          if (!conn.node || typeof conn.node !== 'string') {
            errors.push({
              code: 'INVALID_CONNECTIONS',
              message: `Node "${nodeName}" connection ${i} missing "node" property`,
              node: nodeName,
              field: `connections.main[${outputIndex}][${i}].node`,
              severity: 'error',
            });
          }

          if (!conn.type || typeof conn.type !== 'string') {
            errors.push({
              code: 'INVALID_CONNECTIONS',
              message: `Node "${nodeName}" connection ${i} missing "type" property`,
              node: nodeName,
              field: `connections.main[${outputIndex}][${i}].type`,
              severity: 'error',
            });
          }

          if (typeof conn.index !== 'number') {
            errors.push({
              code: 'INVALID_CONNECTIONS',
              message: `Node "${nodeName}" connection ${i} missing or invalid "index" property`,
              node: nodeName,
              field: `connections.main[${outputIndex}][${i}].index`,
              severity: 'error',
            });
          }
        }
      }
    }
  }

  return errors;
}

// ============================================================================
// Node Type Validation (AC 5.2)
// ============================================================================

/**
 * Validate node type format and known types
 */
function validateNodeTypes(nodes: N8nNode[]): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];
  const nodeIds = new Set<string>();

  for (const node of nodes) {
    // Check for duplicate node IDs
    if (nodeIds.has(node.id)) {
      errors.push({
        code: 'DUPLICATE_NODE_ID',
        message: `Duplicate node ID: "${node.id}"`,
        node: node.id,
        field: 'id',
        severity: 'error',
      });
    }
    nodeIds.add(node.id);

    // Validate node type format
    if (!node.type || typeof node.type !== 'string') {
      errors.push({
        code: 'INVALID_NODE_TYPE',
        message: `Node "${node.name}" missing or invalid "type" property`,
        node: node.id,
        field: 'type',
        severity: 'error',
      });
      continue;
    }

    // Check if type has valid prefix (allowing for community nodes too)
    const hasValidPrefix = NODE_TYPE_PREFIXES.some((prefix) =>
      node.type.startsWith(prefix)
    );

    // Warning for unknown node types (could be community nodes)
    if (!hasValidPrefix && !node.type.startsWith('@')) {
      errors.push({
        code: 'UNKNOWN_NODE_TYPE',
        message: `Node "${node.name}" has unknown type "${node.type}". May be a community node.`,
        node: node.id,
        field: 'type',
        severity: 'warning',
      });
    }

    // Validate typeVersion
    if (typeof node.typeVersion !== 'number' || node.typeVersion < 1) {
      errors.push({
        code: 'INVALID_TYPE_VERSION',
        message: `Node "${node.name}" has invalid typeVersion: ${node.typeVersion}`,
        node: node.id,
        field: 'typeVersion',
        severity: 'error',
      });
    }

    // Validate position
    if (
      !Array.isArray(node.position) ||
      node.position.length !== 2 ||
      typeof node.position[0] !== 'number' ||
      typeof node.position[1] !== 'number'
    ) {
      errors.push({
        code: 'INVALID_POSITION',
        message: `Node "${node.name}" has invalid position. Must be [x, y] number array.`,
        node: node.id,
        field: 'position',
        severity: 'error',
      });
    }
  }

  // Validate all connections reference existing nodes
  return errors;
}

// ============================================================================
// Node Configuration Validation (AC 5.2)
// ============================================================================

/**
 * Validate node-specific configurations
 */
function validateNodeConfigs(
  nodes: N8nNode[],
  connections: N8nConnections
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Check webhook nodes have webhookId
  for (const node of nodes) {
    if (node.type === 'n8n-nodes-base.webhook') {
      if (!node.webhookId && !node.parameters?.webhookId) {
        errors.push({
          code: 'MISSING_WEBHOOK_ID',
          message: `Webhook node "${node.name}" missing webhookId`,
          node: node.id,
          field: 'webhookId',
          severity: 'error',
        });
      }
    }

    // Check HTTP request nodes have URL
    if (node.type === 'n8n-nodes-base.httpRequest') {
      if (!node.parameters?.url && !node.parameters?.path) {
        errors.push({
          code: 'MISSING_URL',
          message: `HTTP Request node "${node.name}" missing URL or path`,
          node: node.id,
          field: 'parameters.url',
          severity: 'error',
        });
      }
    }

    // Check code nodes have code
    if (node.type === 'n8n-nodes-base.code') {
      if (!node.parameters?.code && !node.parameters?.jsCode) {
        errors.push({
          code: 'MISSING_CODE',
          message: `Code node "${node.name}" has no code`,
          node: node.id,
          field: 'parameters.code',
          severity: 'warning',
        });
      }
    }
  }

  // Validate connections reference existing nodes
  for (const [nodeName, nodeConnections] of Object.entries(connections)) {
    if (nodeConnections.main) {
      for (const connectionsArray of nodeConnections.main) {
        if (Array.isArray(connectionsArray)) {
          for (const conn of connectionsArray) {
            if (conn && typeof conn === 'object' && conn.node) {
              if (!nodeIds.has(conn.node as string)) {
                errors.push({
                  code: 'INVALID_CONNECTION_TARGET',
                  message: `Node "${nodeName}" connects to non-existent node "${conn.node}"`,
                  node: nodeName,
                  field: 'connections',
                  severity: 'error',
                });
              }
            }
          }
        }
      }
    }
  }

  return errors;
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate a complete workflow
 *
 * Checks:
 * - Connection structure (2D vs 3D arrays) - AC 5.3
 * - Node types and configurations - AC 5.2
 * - Node references and IDs
 *
 * @param workflow - Workflow to validate
 * @returns Validation result with errors and warnings
 */
export function validateWorkflow(
  workflow: N8nWorkflow | Pick<N8nWorkflow, 'nodes' | 'connections'>
): WorkflowValidationResult {
  const errors: WorkflowValidationError[] = [];
  const warnings: WorkflowValidationError[] = [];

  // Validate nodes array
  if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    errors.push({
      code: 'NO_NODES',
      message: 'Workflow must have at least one node',
      severity: 'error',
    });
    return { valid: false, errors, warnings };
  }

  // Validate connections object
  if (!workflow.connections || typeof workflow.connections !== 'object') {
    errors.push({
      code: 'NO_CONNECTIONS',
      message: 'Workflow must have connections object',
      severity: 'error',
    });
    return { valid: false, errors, warnings };
  }

  // Run validators
  const connectionErrors = validateConnectionStructure(workflow.connections);
  const nodeTypeErrors = validateNodeTypes(workflow.nodes);
  const configErrors = validateNodeConfigs(workflow.nodes, workflow.connections);

  // Separate errors and warnings
  for (const err of [...connectionErrors, ...nodeTypeErrors, ...configErrors]) {
    if (err.severity === 'error') {
      errors.push(err);
    } else {
      warnings.push(err);
    }
  }

  // Workflow is valid if no errors (warnings are OK)
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate workflow and return Result type (for API consistency)
 */
export function validateWorkflowResult(
  workflow: N8nWorkflow | Pick<N8nWorkflow, 'nodes' | 'connections'>
): Result<WorkflowValidationResult> {
  const result = validateWorkflow(workflow);
  return {
    success: result.valid,
    data: result,
  };
}

// ============================================================================
// Export for Testing
// ============================================================================

export {
  validateConnectionStructure,
  validateNodeTypes,
  validateNodeConfigs,
  NODE_TYPE_PREFIXES,
  CORE_NODE_TYPES,
};
