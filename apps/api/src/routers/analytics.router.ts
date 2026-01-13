import { router, adminProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import { DatabaseManager } from '@codename/database';
import { AnalyticsService } from '../services/analytics.service';
import { TRPCError } from '@trpc/server';
import { BASE_PLAN_PRICES } from '../services/admin/pricing.constants';

const dbManager = new DatabaseManager();
const analyticsService = new AnalyticsService(dbManager);

export const analyticsRouter = router({
  // Platform-wide metrics - require admin access
  // TODO: Switch to adminProcedure when authentication is implemented
  getGrowthMetrics: publicProcedure.query(async () => {
    const result = await dbManager.query(`
      SELECT
        SUM(CASE WHEN base_plan_type = 'free' THEN 1 ELSE 0 END) as free,
        SUM(CASE WHEN base_plan_type = 'standard' THEN 1 ELSE 0 END) as standard,
        SUM(CASE WHEN base_plan_type = 'ai_powered' THEN 1 ELSE 0 END) as ai
      FROM public.tenants
    `);
    return {
      freeUsers: parseInt(result.rows[0].free || '0', 10),
      standardUsers: parseInt(result.rows[0].standard || '0', 10),
      aiUsers: parseInt(result.rows[0].ai || '0', 10)
    };
  }),

  getViralMetrics: publicProcedure.query(async () => {
    const kFactor = await analyticsService.getKFactor();
    const referrals = await dbManager.query(`SELECT COUNT(*) FROM public.referral_program`);
    return {
      kFactor,
      referralCount: parseInt(referrals.rows[0].count || '0', 10)
    };
  }),

  getFunnelMetrics: publicProcedure.query(async () => {
    const metrics = await analyticsService.getFunnelMetrics({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    });
    return metrics;
  }),

  getFinancialMetrics: publicProcedure.query(async () => {
    const result = await dbManager.query(`
      SELECT
        SUM(CASE WHEN base_plan_type = 'standard' THEN 1 ELSE 0 END) as standard,
        SUM(CASE WHEN base_plan_type = 'ai_powered' THEN 1 ELSE 0 END) as ai
      FROM public.tenants
    `);
    const standard = parseInt(result.rows[0].standard || '0', 10);
    const ai = parseInt(result.rows[0].ai || '0', 10);

    // Use BASE_PLAN_PRICES constant instead of hardcoded values
    const mrr = (standard * BASE_PLAN_PRICES.standard) + (ai * BASE_PLAN_PRICES.ai_powered);

    const ltvCac = await analyticsService.getLTV_CAC();

    return { mrr, ltvCac };
  }),

  trackEvent: publicProcedure
    .input(z.object({
      eventName: z.string().max(100),
      properties: z.record(z.any()).optional(),
      visitorId: z.string().max(100).optional(),
      tenantId: z.string().max(100).optional()
    }))
    .mutation(async ({ input }) => {
      await analyticsService.trackEvent(input.eventName, input.properties || {}, input.tenantId, input.visitorId);
      return { success: true };
    })
});
