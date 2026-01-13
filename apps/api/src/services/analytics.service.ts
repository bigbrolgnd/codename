import { DatabaseManager } from '@codename/database';
import { z } from 'zod';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface FunnelMetrics {
  stages: { name: string; count: number; dropOff: number }[];
}

// Zod schema for date range validation
const DateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine(data => data.start <= data.end, {
  message: 'start date must be before or equal to end date'
});

export class AnalyticsService {
  constructor(private db: DatabaseManager) {}

  /**
   * Track an analytics event
   * @param eventName - Name of the event (max 100 chars)
   * @param properties - Event properties (will be JSON stringified)
   * @param tenantId - Optional tenant identifier
   * @param visitorId - Optional visitor identifier
   * @throws Error if database operation fails
   */
  async trackEvent(
    eventName: string,
    properties: Record<string, any>,
    tenantId?: string,
    visitorId?: string
  ): Promise<void> {
    // Validate inputs
    if (eventName.length > 100) {
      throw new Error('eventName must be 100 characters or less');
    }

    await this.db.query(
      `INSERT INTO public.analytics_events (event_name, properties, tenant_id, visitor_id, timestamp)
       VALUES ($1, $2, $3, $4, NOW())`,
      [eventName, JSON.stringify(properties), tenantId || null, visitorId || null]
    );
  }

  /**
   * Track a funnel step for analytics
   * @param visitorId - Unique visitor identifier
   * @param step - Funnel step name
   */
  async trackFunnelStep(visitorId: string, step: string): Promise<void> {
    await this.trackEvent('funnel_step', { step }, undefined, visitorId);
  }

  /**
   * Track a conversion event
   * @param visitorId - Unique visitor identifier
   * @param stage - Conversion stage
   */
  async trackConversion(visitorId: string, stage: string): Promise<void> {
    await this.trackEvent('conversion', { stage }, undefined, visitorId);
  }

  /**
   * Get funnel metrics for a date range
   * @param dateRange - Date range for query (validated)
   * @returns Funnel metrics with stage counts and drop-off
   * @throws Error if validation fails or database operation fails
   */
  async getFunnelMetrics(dateRange: DateRange): Promise<FunnelMetrics> {
    // Validate date range
    const validatedRange = DateRangeSchema.parse(dateRange);

    const result = await this.db.query(
      `SELECT properties->>'step' as step, COUNT(*) as count
       FROM public.analytics_events
       WHERE event_name = 'funnel_step'
       AND timestamp BETWEEN $1 AND $2
       GROUP BY step`,
      [validatedRange.start, validatedRange.end]
    );

    return {
      stages: result.rows.map(r => ({
        name: r.step,
        count: parseInt(r.count, 10),
        dropOff: 0 // TODO: Calculate drop-off between stages
      }))
    };
  }

  /**
   * Calculate K-Factor (viral coefficient)
   * K-Factor = (number of invitations sent per user) × (conversion rate of invitations)
   * @returns Calculated K-Factor (0 if no data available)
   */
  async getKFactor(): Promise<number> {
    const totalCustomersRes = await this.db.query(
      `SELECT COUNT(*) FROM public.tenants WHERE status IN ('active', 'provisioned')`
    );
    const totalReferralsSentRes = await this.db.query(
      `SELECT COUNT(*) FROM public.referral_program`
    );
    const totalConvertedRes = await this.db.query(
      `SELECT COUNT(*) FROM public.referral_program WHERE status = 'converted'`
    );

    const n = parseInt(totalCustomersRes.rows[0].count || '0', 10);
    const i_total = parseInt(totalReferralsSentRes.rows[0].count || '0', 10);
    const c_total = parseInt(totalConvertedRes.rows[0].count || '0', 10);

    if (n === 0 || i_total === 0) return 0;

    const i = i_total / n; // Average invitations sent per customer
    const c = c_total / i_total; // Conversion rate of invitations

    return parseFloat((i * c).toFixed(4));
  }

  /**
   * Calculate LTV/CAC ratio (Lifetime Value to Customer Acquisition Cost)
   * NOTE: This is a placeholder that returns 3.5 as a reasonable default
   * A proper implementation requires:
   * - Tracking total marketing spend
   * - Calculating average customer lifetime
   * - Computing actual customer lifetime value
   *
   * @returns LTV/CAC ratio (placeholder: 3.5)
   */
  async getLTV_CAC(): Promise<number> {
    // TODO: Implement proper LTV/CAC calculation
    // Requires:
    // 1. Total marketing spend by channel
    // 2. Customer acquisition by channel
    // 3. Customer lifetime value by cohort
    // 4. Churn rate calculation

    // For now, return industry-standard healthy SaaS ratio
    return 3.5;
  }

  /**
   * Export metrics as CSV
   * NOTE: This is a placeholder implementation
   * A proper implementation would:
   * - Accept report type parameter (growth, viral, financial, etc.)
   * - Generate actual CSV from query results
   * - Support date range filtering
   * - Handle large datasets with streaming
   *
   * @param reportType - Type of report to export
   * @returns CSV data as buffer
   */
  async exportMetrics(reportType: string): Promise<Buffer> {
    // TODO: Implement proper CSV export
    // Requires:
    // 1. Report type validation
    // 2. Date range parameters
    // 3. Query appropriate data based on report type
    // 4. Format as CSV with proper headers
    // 5. Handle large datasets with streaming

    throw new Error(`exportMetrics for '${reportType}' is not yet implemented. Please use the API endpoints directly.`);
  }
}
