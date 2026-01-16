/**
 * n8n API Types
 *
 * TypeScript interfaces for n8n REST API requests and responses.
 * Based on n8n API documentation: https://docs.n8n.io/api/
 */

// ============================================================================
// Result Wrapper Pattern (architecture.md#Section 4)
// ============================================================================

export type Result<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

// ============================================================================
// Authentication Types
// ============================================================================

export interface N8nLoginRequest {
  emailOrLdapLoginId: string;
  password: string;
}

export interface N8nSession {
  cookie: string;
  expiresAt: Date;
}

// ============================================================================
// Workflow Types
// ============================================================================

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: N8nWorkflowSettings;
  tags?: N8nTag[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, { id: string; name: string }>;
  webhookId?: string;
}

export interface N8nConnections {
  [nodeName: string]: {
    main?: Array<Array<{
      node: string;
      type: string;
      index: number;
    }>>;
  };
}

export interface N8nWorkflowSettings {
  executionOrder?: 'v1' | 'anySuccess';
  saveManualExecutions?: boolean;
  callerPolicy?: string;
  errorWorkflow?: string;
}

export interface N8nTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Workflow CRUD Types
// ============================================================================

export interface CreateWorkflowRequest {
  name: string;
  nodes: N8nNode[];
  connections: N8nConnections;
  active?: boolean;
  settings?: N8nWorkflowSettings;
  tags?: string[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  nodes?: N8nNode[];
  connections?: N8nConnections;
  active?: boolean;
  settings?: N8nWorkflowSettings;
  tags?: string[];
}

export interface WorkflowListResponse {
  data: N8nWorkflow[];
  nextCursor?: string;
}

// ============================================================================
// Workflow Activation Types
// ============================================================================

export interface ActivateWorkflowResponse {
  id: string;
  active: boolean;
}

// ============================================================================
// Execution Types
// ============================================================================

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: 'manual' | 'trigger' | 'webhook' | 'retry';
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  data?: N8nExecutionData;
  error?: N8nExecutionError;
}

export interface N8nExecutionData {
  resultData: {
    runData: {
      [nodeName: string]: Array<{
        startTime: string;
        executionTime?: number;
        success: boolean;
        error?: N8nExecutionError;
        data?: {
          main: Array<Array<{
            json: Record<string, unknown>;
            pairedItem?: { item: number; input: number };
          }>>;
        };
      }>;
    };
    lastNodeExecuted?: string;
  };
  executionData?: {
    contextData: Record<string, unknown>;
    nodeExecutionStack: Record<string, unknown>;
    metadata: Record<string, unknown>;
    waitingExecution: Record<string, unknown>;
    waitingExecutionSource: Record<string, unknown>;
  };
}

export interface N8nExecutionError {
  message: string;
  name: string;
  description?: string;
  node?: {
    id: string;
    name: string;
    type: string;
  };
}

// ============================================================================
// Webhook Testing Types
// ============================================================================

export interface WebhookTestRequest {
  workflowId: string;
  payload?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface WebhookTestResponse {
  executionId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: N8nExecution;
  error?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface WorkflowValidationError {
  code: string;
  message: string;
  node?: string;
  field?: string;
  severity: 'error' | 'warning';
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationError[];
}

// ============================================================================
// Error Types
// ============================================================================

export interface N8nApiError {
  code: string;
  message: string;
  statusCode?: number;
  details?: unknown;
}

export type N8nErrorCode =
  | 'AUTH_FAILED'
  | 'SESSION_EXPIRED'
  | 'WORKFLOW_NOT_FOUND'
  | 'INVALID_CONNECTIONS'
  | 'WEBHOOK_NOT_REGISTERED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// ============================================================================
// Configuration Types
// ============================================================================

export interface N8nClientConfig {
  baseUrl: string;
  email: string;
  password: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  /** Docker container name for CLI activation (default: 'n8n') */
  dockerContainerName?: string;
}
