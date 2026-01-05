import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { ProvisioningRequestSchema, ProvisioningStatusSchema } from '@codename/api';
import { ProvisioningService } from '../services/provision.service';

const t = initTRPC.create();
const provisioningService = new ProvisioningService();

// Mock in-memory storage for status
export const provisioningJobs = new Map<string, any>();

export const provisionRouter = t.router({
  start: t.procedure
    .input(ProvisioningRequestSchema)
    .mutation(async ({ input }) => {
      const provisioningId = crypto.randomUUID();
      
      const initialStatus = {
        provisioningId,
        status: 'pending',
        currentPhase: 'architecture',
        phaseProgress: 0,
        overallProgress: 0,
        logs: [],
      };
      
      provisioningJobs.set(provisioningId, initialStatus);

      // Trigger provisioning logic
      provisioningService.startProvisioning(provisioningId, input);
      
      return { provisioningId };
    }),

  getStatus: t.procedure
    .input(z.object({ provisioningId: z.string().uuid() }))
    .query(({ input }) => {
      const status = provisioningJobs.get(input.provisioningId);
      if (!status) {
        throw new Error('Provisioning job not found');
      }
      return status;
    }),

  /**
   * Internal webhook for n8n to update status
   * In production, this would be protected by a shared secret header
   */
  updateStatus: t.procedure
    .input(z.object({
      provisioningId: z.string().uuid(),
      update: z.any() // Simplified for now
    }))
    .mutation(async ({ input }) => {
      const current = provisioningJobs.get(input.provisioningId);
      if (!current) throw new Error('Job not found');
      
      provisioningJobs.set(input.provisioningId, { ...current, ...input.update });
      return { success: true };
    }),
});
