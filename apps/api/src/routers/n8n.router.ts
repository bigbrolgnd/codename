/**
 * n8n Workflow Management Router
 *
 * tRPC router for n8n workflow operations.
 * Provides programmatic access to create, test, and manage n8n workflows.
 *
 * Story 3-8: n8n Workflow Management API
 */

import { router, adminProcedure } from '../trpc';
import { z } from 'zod';
import {
  authenticate,
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  getExecutions,
  getExecution,
  testWebhook,
  validateWorkflow,
} from '../services/n8n';
import { TRPCError } from '@trpc/server';

export const n8nRouter = router({
  // ========================================================================
  // Authentication
  // ========================================================================

  authenticate: adminProcedure
    .mutation(async () => {
      try {
        const result = await authenticate();

        if (!result.success) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: result.error?.message || 'Authentication failed',
          });
        }

        return {
          success: true,
          message: 'Authenticated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  // ========================================================================
  // Workflow CRUD Operations
  // ========================================================================

  listWorkflows: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async () => {
      try {
        const result = await listWorkflows();

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error?.message || 'Failed to list workflows',
          });
        }

        return {
          success: true,
          workflows: result.data?.workflows || [],
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  getWorkflow: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const result = await getWorkflow(input.id);

        if (!result.success) {
          if (result.error?.code === 'WORKFLOW_NOT_FOUND') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: result.error.message,
            });
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error?.message || 'Failed to get workflow',
          });
        }

        return result.data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  createWorkflow: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      nodes: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        typeVersion: z.number(),
        position: z.tuple([z.number(), z.number()]),
        parameters: z.record(z.unknown()),
      })),
      connections: z.record(z.unknown()),
      active: z.boolean().default(false).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await createWorkflow(input as any);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error?.message || 'Failed to create workflow',
          });
        }

        return {
          success: true,
          workflow: result.data,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  updateWorkflow: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      nodes: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        typeVersion: z.number(),
        position: z.tuple([z.number(), z.number()]),
        parameters: z.record(z.unknown()),
      })).optional(),
      connections: z.record(z.unknown()).optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;
        const result = await updateWorkflow(id, updateData as any);

        if (!result.success) {
          if (result.error?.code === 'WORKFLOW_NOT_FOUND') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: result.error.message,
            });
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error?.message || 'Failed to update workflow',
          });
        }

        return {
          success: true,
          workflow: result.data,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  deleteWorkflow: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await deleteWorkflow(input.id);

        if (!result.success) {
          if (result.error?.code === 'WORKFLOW_NOT_FOUND') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: result.error.message,
            });
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error?.message || 'Failed to delete workflow',
          });
        }

        return {
          success: true,
          deleted: true,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  // ========================================================================
  // Workflow Activation
  // ========================================================================

  activateWorkflow: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await activateWorkflow(input.id);

        if (!result.success) {
          if (result.error?.code === 'WORKFLOW_NOT_FOUND') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: result.error.message,
            });
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error?.message || 'Failed to activate workflow',
          });
        }

        return {
          success: true,
          active: result.data?.active ?? true,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  deactivateWorkflow: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await deactivateWorkflow(input.id);

        if (!result.success) {
          if (result.error?.code === 'WORKFLOW_NOT_FOUND') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: result.error.message,
            });
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error?.message || 'Failed to deactivate workflow',
          });
        }

        return {
          success: true,
          active: result.data?.active ?? false,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  // ========================================================================
  // Executions
  // ========================================================================

  getExecutions: adminProcedure
    .input(z.object({
      workflowId: z.string(),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ input }) => {
      try {
        const result = await getExecutions(input.workflowId, input.limit);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error?.message || 'Failed to get executions',
          });
        }

        return {
          success: true,
          executions: result.data || [],
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  getExecution: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const result = await getExecution(input.id);

        if (!result.success) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: result.error?.message || 'Execution not found',
          });
        }

        return result.data;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  // ========================================================================
  // Webhook Testing
  // ========================================================================

  testWebhook: adminProcedure
    .input(z.object({
      workflowId: z.string(),
      webhookPath: z.string(),
      payload: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await testWebhook(
          input.workflowId,
          input.webhookPath,
          input.payload
        );

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error?.message || 'Webhook test failed',
            cause: result.error?.details,
          });
        }

        return {
          success: true,
          executionId: result.data?.executionId,
          status: result.data?.status,
          result: result.data?.result,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  // ========================================================================
  // Workflow Validation
  // ========================================================================

  validateWorkflow: adminProcedure
    .input(z.object({
      nodes: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        typeVersion: z.number(),
        position: z.tuple([z.number(), z.number()]),
        parameters: z.record(z.unknown()),
      })),
      connections: z.record(z.unknown()),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await validateWorkflow(input as any);

        return {
          success: true,
          valid: result.data?.valid ?? false,
          errors: result.data?.errors || [],
          warnings: result.data?.warnings || [],
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),
});
