/**
 * Activity Router
 *
 * tRPC router for activity queries and polling.
 * Provides endpoints for fetching recent Stripe webhook events.
 */

import { router, adminProcedure } from '../trpc';
import { z } from 'zod';
import { ActivityService } from '../services/admin/activity.service';
import { DatabaseManager } from '@codename/database';

const db = new DatabaseManager();
const activityService = new ActivityService(db);

export const activityRouter = router({
  /**
   * Get recent Stripe webhook events for activity polling
   *
   * Returns the most recent webhook events, ordered by processed_at DESC.
   * Used by useStripeWebhookActivity hook to trigger activity state changes.
   */
  getRecentStripeEvents: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10).optional(),
      tenantId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      const limit = input.limit ?? 10;

      const events = await activityService.getRecentStripeEvents(limit, input.tenantId);

      return {
        events,
        count: events.length,
        fetchedAt: new Date().toISOString(),
      };
    }),

  /**
   * Check if a webhook event has been processed
   *
   * Used to prevent duplicate processing of webhook events.
   */
  isEventProcessed: adminProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .query(async ({ input }) => {
      const processed = await activityService.isEventProcessed(input.eventId);

      return {
        eventId: input.eventId,
        processed,
      };
    }),
});
