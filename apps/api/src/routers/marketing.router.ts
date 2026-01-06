import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { MarketingSettingsSchema, UpdateMarketingSettingsSchema } from '@codename/api';
import { DatabaseManager } from '@codename/database';
import { MarketingService } from '../services/admin/marketing.service';
import { TRPCError } from '@trpc/server';

const dbManager = new DatabaseManager();
const marketingService = new MarketingService(dbManager);

export const marketingRouter = router({
  getSettings: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
    }))
    .output(MarketingSettingsSchema)
    .query(async ({ input }) => {
      // Validate tenant exists before querying (prevents enumeration)
      const tenantExists = await dbManager.query(
        `SELECT 1 FROM tenants WHERE schema_name = $1 LIMIT 1`,
        [input.tenantId]
      );

      if (!tenantExists.rows.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        });
      }

      try {
        return await marketingService.getSettings(input.tenantId);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  updateSettings: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      settings: UpdateMarketingSettingsSchema,
    }))
    .output(MarketingSettingsSchema)
    .mutation(async ({ input }) => {
      // Validate tenant exists before allowing updates (prevents enumeration)
      const tenantExists = await dbManager.query(
        `SELECT 1 FROM tenants WHERE schema_name = $1 LIMIT 1`,
        [input.tenantId]
      );

      if (!tenantExists.rows.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        });
      }

      try {
        return await marketingService.updateSettings(input.tenantId, input.settings);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),
});
