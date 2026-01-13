import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { DatabaseManager } from '@codename/database';
import { ReferralService } from '../services/referral.service';
import { TRPCError } from '@trpc/server';

const dbManager = new DatabaseManager();
const referralService = new ReferralService(dbManager);

export const referralRouter = router({
  getStats: publicProcedure
    .input(z.string())
    .query(async ({ input: tenantId }) => {
      try {
        return await referralService.getReferralStats(tenantId);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  getHistory: publicProcedure
    .input(z.string())
    .query(async ({ input: tenantId }) => {
      try {
          const result = await dbManager.query(
            `SELECT id, referee_tenant_id, status, created_at 
             FROM public.referral_program 
             WHERE referrer_tenant_id = $1
             ORDER BY created_at DESC
             LIMIT 50`,
            [tenantId]
          );
          
          return result.rows.map(row => ({
              id: row.id,
              refereeTenantId: row.referee_tenant_id,
              status: row.status,
              createdAt: row.created_at
          }));
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),
});
