import { router, publicProcedure, usageGuard } from '../trpc';
import { z } from 'zod';
import {
  ActionFeedResponseSchema,
  ActionItem,
  AgentMessageSchema,
  SendAgentMessageResponseSchema,
  StaffListResponseSchema,
  StaffSchema,
  InsightSummarySchema,
  HeatmapItemSchema,
  ThemeCustomizationSchema,
  SaveThemeResponseSchema,
  GetThemeResponseSchema,
  PricingConfigSchema,
  TenantAddonSchema
} from '@codename/api';
import { DatabaseManager } from '@codename/database';
import { TRPCError } from '@trpc/server';
import { IntentService } from '../services/admin/intent.service';
import { AggregationService } from '../services/admin/aggregation.service';
import { SummaryGeneratorService } from '../services/admin/summary-generator.service';
import { BillingService } from '../services/admin/billing.service';
import { ReputationService } from '../services/admin/reputation.service';
import { ThemeService } from '../services/admin/theme.service';
import { PricingService } from '../services/admin/pricing.service';

const dbManager = new DatabaseManager();
const intentService = new IntentService();
const aggregationService = new AggregationService(dbManager);
const summaryService = new SummaryGeneratorService();
const billingService = new BillingService(dbManager);
const reputationService = new ReputationService(dbManager);
const themeService = new ThemeService(dbManager);
const pricingService = new PricingService(dbManager, billingService);

export const adminRouter = router({
  getTheme: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
    }))
    .output(GetThemeResponseSchema)
    .query(async ({ input }) => {
      try {
        return await themeService.getTheme(input.tenantId);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  saveTheme: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      theme: ThemeCustomizationSchema,
    }))
    .output(SaveThemeResponseSchema)
    .mutation(async ({ input }) => {
      try {
        return await themeService.saveTheme(input.tenantId, input.theme);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  publishTheme: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      themeId: z.string().uuid(),
    }))
    .output(SaveThemeResponseSchema)
    .mutation(async ({ input }) => {
      try {
        return await themeService.publishTheme(input.tenantId, input.themeId);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  getSubscriptionStatus: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
    }))
    .query(async ({ input }) => {
      try {
        return await billingService.getSubscriptionStatus(input.tenantId);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  subscribeToDesignStudio: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
    }))
    .mutation(async ({ input }) => {
      try {
        return await billingService.subscribeToDesignStudio(input.tenantId);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  getActionFeed: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      limit: z.number().min(1).max(50).default(10),
    }))
    .output(ActionFeedResponseSchema)
    .query(async ({ input }) => {
      try {
        // High-performance single query combining bookings and reviews
        const combinedResult = await dbManager.queryInSchema(input.tenantId,
          `(SELECT 
              b.id, 
              'booking' as type, 
              'New Booking' as title, 
              b.customer_name || ' booked ' || s.name as description, 
              b.start_time as timestamp, 
              'high' as priority,
              json_build_object('bookingId', b.id) as metadata
            FROM bookings b
            JOIN services s ON b.service_id = s.id)
           UNION ALL
           (SELECT 
              r.id, 
              'review' as type, 
              'New ' || r.rating || '-Star Review' as title, 
              '\"' || r.content || '\" - ' || r.author_name as description, 
              r.created_at as timestamp, 
              CASE WHEN r.rating < 4 THEN 'high' ELSE 'medium' END as priority,
              json_build_object(
                'authorName', r.author_name,
                'rating', r.rating,
                'content', r.content,
                'initialDraft', r.response_content
              ) as metadata
            FROM reviews r)
           ORDER BY timestamp DESC
           LIMIT $1`,
          [input.limit]
        );

        const items: ActionItem[] = combinedResult.rows.map(row => ({
          id: row.id,
          type: row.type,
          title: row.title,
          description: row.description,
          timestamp: row.timestamp.toISOString(),
          priority: row.priority,
          isRead: false,
          metadata: row.metadata
        }));

        return {
          items,
          totalCount: items.length,
        };
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Tenant '${input.tenantId}' not found`,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  sendAgentMessage: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      message: z.string().min(1),
    }))
    .use(usageGuard)
    .output(SendAgentMessageResponseSchema)
    .mutation(async ({ input }) => {
      try {
        const { reply, intent } = await intentService.process(input.message);
        
        // Record usage
        await billingService.recordAiUsage(input.tenantId, 1);

        return {
          response: {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: reply,
            timestamp: new Date().toISOString(),
            intentDetected: intent,
          },
          actionRequired: !!intent && intent !== 'greeting',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  getUsageStatus: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
    }))
    .query(async ({ input }) => {
      try {
        return await billingService.getUsageStatus(input.tenantId);
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

  listStaff: publicProcedure    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
    }))
    .output(StaffListResponseSchema)
    .query(async ({ input }) => {
      try {
        const result = await dbManager.queryInSchema(input.tenantId,
          `SELECT id, name, email, role, created_at FROM staff ORDER BY created_at ASC`
        );
        
        return result.rows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          createdAt: row.created_at.toISOString(),
        }));
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

  inviteStaff: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      name: z.string().min(2),
      email: z.string().email(),
      role: z.enum(['admin', 'manager', 'staff']),
    }))
    .output(StaffSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await dbManager.queryInSchema(input.tenantId,
          `INSERT INTO staff (name, email, role) VALUES ($1, $2, $3) RETURNING *`,
          [input.name, input.email, input.role]
        );
        
        const row = result.rows[0];
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          createdAt: row.created_at.toISOString(),
        };
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

  deleteStaff: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      staffId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      try {
        await dbManager.queryInSchema(input.tenantId,
          `DELETE FROM staff WHERE id = $1`,
          [input.staffId]
        );
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

  triggerAggregation: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .mutation(async ({ input }) => {
      try {
        return await aggregationService.aggregateDailyStats(input.tenantId, input.date);
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

  getAggregatedStats: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .query(async ({ input }) => {
      try {
        const result = await dbManager.queryInSchema(input.tenantId,
          `SELECT stat_date as date, total_revenue as revenue, total_bookings as bookings, total_visitors as visitors 
           FROM daily_stats 
           WHERE stat_date BETWEEN $1 AND $2 
           ORDER BY stat_date ASC`,
          [input.startDate, input.endDate]
        );
        return result.rows;
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

  getPlainEnglishSummary: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
    }))
    .output(z.array(InsightSummarySchema))
    .query(async ({ input }) => {
      try {
        // Fetch last 7 days of aggregated data
        const stats = await dbManager.queryInSchema(input.tenantId,
          `SELECT SUM(total_revenue) as rev, SUM(total_bookings) as bks, SUM(total_visitors) as vis
           FROM daily_stats
           WHERE stat_date > NOW() - INTERVAL '7 days'`
        );

        // Fetch previous 7 days for trend
        const prevStats = await dbManager.queryInSchema(input.tenantId,
          `SELECT SUM(total_revenue) as rev, SUM(total_bookings) as bks, SUM(total_visitors) as vis
           FROM daily_stats
           WHERE stat_date <= NOW() - INTERVAL '7 days' AND stat_date > NOW() - INTERVAL '14 days'`
        );

        const current = stats.rows[0];
        const prev = prevStats.rows[0];

        return summaryService.generate({
          totalRevenue: parseInt(current.rev || '0'),
          totalBookings: parseInt(current.bks || '0'),
          totalVisitors: parseInt(current.vis || '0'),
          prevRevenue: parseInt(prev.rev || '0'),
          prevBookings: parseInt(prev.bks || '0'),
          prevVisitors: parseInt(prev.vis || '0'),
        });
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

  getBuyerHeatmap: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
    }))
    .output(z.array(HeatmapItemSchema))
    .query(async ({ input }) => {
      try {
        const result = await dbManager.queryInSchema(input.tenantId,
          `SELECT city as location, COUNT(*) as count, 'city' as type
           FROM visit_logs
           WHERE city IS NOT NULL
           GROUP BY city
           ORDER BY count DESC
           LIMIT 5`
        );

        const items = result.rows;
        const total = items.reduce((sum, item) => sum + parseInt(item.count), 0);

        return items.map(item => ({
          location: item.location,
          count: parseInt(item.count),
          percentage: total > 0 ? Math.round((parseInt(item.count) / total) * 100) : 0,
          type: item.type as 'city' | 'county',
        }));
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

  postReviewResponse: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      reviewId: z.string().uuid(),
      response: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        await dbManager.queryInSchema(input.tenantId,
          `UPDATE reviews
           SET response_content = $1, response_at = NOW()
           WHERE id = $2`,
          [input.response, input.reviewId]
        );
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

  // Pricing endpoints
  getPricingConfig: publicProcedure
    .input(z.object({}).optional())
    .output(z.object({
      success: z.boolean(),
      pricing: z.array(PricingConfigSchema),
    }))
    .query(async () => {
      try {
        const pricing = await pricingService.getAllPricing();
        return { success: true, pricing };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  getTenantAddons: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
    }))
    .output(z.object({
      success: z.boolean(),
      addons: z.array(TenantAddonSchema),
    }))
    .query(async ({ input }) => {
      try {
        const addons = await pricingService.getTenantAddons(input.tenantId);
        return { success: true, addons };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  getTenantPlan: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
    }))
    .output(z.object({
      base_plan_type: z.enum(['free', 'standard', 'ai_powered']),
      billing_interval: z.enum(['monthly', 'quarterly', 'annual']),
    }))
    .query(async ({ input }) => {
      try {
        const result = await dbManager.query(
          'SELECT base_plan_type, billing_interval FROM public.tenants WHERE schema_name = $1',
          [input.tenantId]
        );
        if (result.rows.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant not found' });
        }
        return result.rows[0];
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  subscribeToAddon: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      addonId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const subscription = await pricingService.subscribeToAddon(input.tenantId, input.addonId);
        return { success: true, subscription };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),

  unsubscribeFromAddon: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      addonId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await pricingService.unsubscribeFromAddon(input.tenantId, input.addonId);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
    }),
});
