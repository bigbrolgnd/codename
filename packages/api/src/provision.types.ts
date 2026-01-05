import { z } from 'zod';
import { 
  ProvisioningRequestSchema, 
  ProvisioningStatusSchema, 
  ProvisioningLogSchema 
} from './schemas/provision.schema';

export type ProvisioningRequest = z.infer<typeof ProvisioningRequestSchema>;
export type ProvisioningStatusResponse = z.infer<typeof ProvisioningStatusSchema>;
export type ProvisioningLog = z.infer<typeof ProvisioningLogSchema>;

export type ProvisioningPhase = 'architecture' | 'intelligence' | 'security' | 'launch';
export type ProvisioningJobStatus = 'pending' | 'in_progress' | 'complete' | 'failed';
