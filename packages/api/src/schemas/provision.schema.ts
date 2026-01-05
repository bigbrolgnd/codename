import { z } from 'zod';
import { ExtractedServiceSchema } from './extraction.schema';

/**
 * Request to start the automated provisioning process
 */
export const ProvisioningRequestSchema = z.object({
  services: z.array(ExtractedServiceSchema),
  businessName: z.string().optional(),
  sourceImageId: z.string().optional(),
  preferences: z.object({
    colorScheme: z.enum(['auto', 'light', 'dark']).optional(),
    timezone: z.string().optional(),
  }).optional(),
});

/**
 * Individual log entry for the provisioning terminal
 */
export const ProvisioningLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  message: z.string(),
  type: z.enum(['info', 'success', 'warning']),
});

/**
 * Current status of a provisioning job
 */
export const ProvisioningStatusSchema = z.object({
  provisioningId: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'complete', 'failed']),
  currentPhase: z.enum(['architecture', 'intelligence', 'security', 'launch']),
  phaseProgress: z.number().min(0).max(100),
  overallProgress: z.number().min(0).max(100),
  latestLog: ProvisioningLogSchema.optional(),
  result: z.object({
    siteUrl: z.string().url(),
    dashboardUrl: z.string().url(),
    tenantId: z.string(),
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    phase: z.string(),
    canRetry: z.boolean(),
  }).optional(),
});
