/**
 * Activity Service
 *
 * Service to fetch recent activity events for polling-based activity tracking.
 * Provides methods to query recent Stripe webhook events from the database.
 */

import { DatabaseManager } from '@codename/database';

export interface StripeWebhookEvent {
  id: string;
  event_type: string;
  event_id: string;
  tenant_id?: string;
  processed_at: Date;
}

export class ActivityService {
  constructor(private db: DatabaseManager) {}

  /**
   * Get recent Stripe webhook events for activity polling
   *
   * @param limit - Maximum number of events to return (default: 10)
   * @param tenantId - Optional tenant ID to filter events
   * @returns Array of recent webhook events ordered by processed_at DESC
   */
  async getRecentStripeEvents(limit: number = 10, tenantId?: string): Promise<StripeWebhookEvent[]> {
    const query = tenantId
      ? `
        SELECT
          id,
          event_type,
          event_id,
          tenant_id,
          processed_at
        FROM stripe_webhook_events
        WHERE tenant_id = $1
        ORDER BY processed_at DESC
        LIMIT $2
      `
      : `
        SELECT
          id,
          event_type,
          event_id,
          tenant_id,
          processed_at
        FROM stripe_webhook_events
        ORDER BY processed_at DESC
        LIMIT $1
      `;

    const params = tenantId
      ? [tenantId, limit]
      : [limit];

    const result = await this.db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      event_type: row.event_type,
      event_id: row.event_id,
      tenant_id: row.tenant_id,
      processed_at: row.processed_at,
    }));
  }

  /**
   * Check if a webhook event has already been processed
   *
   * @param eventId - Stripe event ID
   * @returns True if event exists, false otherwise
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM stripe_webhook_events WHERE event_id = $1 LIMIT 1',
      [eventId]
    );

    return result.rows.length > 0;
  }

  /**
   * Record a webhook event for activity tracking
   *
   * @param eventType - Stripe event type (e.g., 'payment_intent.succeeded')
   * @param eventId - Stripe event ID
   * @param tenantId - Optional tenant ID
   */
  async recordWebhookEvent(
    eventType: string,
    eventId: string,
    tenantId?: string
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO stripe_webhook_events (event_type, event_id, tenant_id, processed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (event_id) DO NOTHING`,
      [eventType, eventId, tenantId || null]
    );
  }
}
