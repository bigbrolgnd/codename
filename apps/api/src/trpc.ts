import { initTRPC, TRPCError } from '@trpc/server';
import { DatabaseManager } from '@codename/database';
import { BillingService } from './services/admin/billing.service';

const t = initTRPC.create();
const db = new DatabaseManager();
const billing = new BillingService(db);

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

/**
 * Middleware to check if tenant has reached their AI cost cap.
 * IMPORTANT: Must be applied AFTER .input() to receive the tenantId.
 */
export const usageGuard = middleware(async ({ input, next }) => {
  const { tenantId } = (input ?? {}) as { tenantId?: string };
  
  if (tenantId) {
    const isCapped = await billing.checkAiCap(tenantId);
    if (isCapped) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Monthly AI Cost Cap reached. Upgrade your plan to increase limits.',
      });
    }
  }
  
  return next();
});

