import { DatabaseManager } from '@codename/database';
import { BILLING_CONFIG } from './billing.constants';

export class AggregationService {
  constructor(private db: DatabaseManager) {}

  /**
   * Aggregates stats for a specific date and tenant
   */
  async aggregateDailyStats(tenantId: string, dateStr: string) {
    // 1. Calculate Revenue and Booking count from 'bookings' table
    // We join with services to get the price
    const bookingStats = await this.db.queryInSchema(tenantId,
      `SELECT 
        COUNT(b.id) as booking_count,
        COALESCE(SUM(s.price), 0) as total_revenue
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.start_time::date = $1::date AND b.status != 'cancelled'`,
      [dateStr]
    );

    // 2. Calculate Visitor count from 'visit_logs'
    const visitorStats = await this.db.queryInSchema(tenantId,
      `SELECT 
        COUNT(DISTINCT visitor_id) as visitor_count,
        mode() WITHIN GROUP (ORDER BY city) as top_city
       FROM visit_logs
       WHERE created_at::date = $1::date`,
      [dateStr]
    );

    const { booking_count, total_revenue } = bookingStats.rows[0];
    const { visitor_count, top_city } = visitorStats.rows[0];

    // 2.5 Calculate Review stats
    const reviewStats = await this.db.queryInSchema(tenantId,
      `SELECT 
        COUNT(id) as review_count,
        AVG(rating) as avg_rating
       FROM reviews
       WHERE created_at::date = $1::date`,
      [dateStr]
    );
    const { review_count, avg_rating } = reviewStats.rows[0];

    // 3. Upsert into 'daily_stats'
    await this.db.queryInSchema(tenantId,
      `INSERT INTO daily_stats (stat_date, total_revenue, total_bookings, total_visitors, top_city, avg_rating, total_reviews, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (stat_date) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_bookings = EXCLUDED.total_bookings,
        total_visitors = EXCLUDED.total_visitors,
        top_city = EXCLUDED.top_city,
        avg_rating = EXCLUDED.avg_rating,
        total_reviews = EXCLUDED.total_reviews,
        updated_at = NOW()`,
      [dateStr, total_revenue, booking_count, visitor_count, top_city, avg_rating, review_count]
    );

    // 4. Update monthly usage and calculate overages (public schema)
    const monthStart = new Date(dateStr);
    monthStart.setDate(1);
    const monthStr = monthStart.toISOString().split('T')[0];

    // Get current monthly visits
    const usageResult = await this.db.queryInSchema('public',
      `SELECT visits_total FROM tenant_usage WHERE tenant_id = $1 AND month_year = $2`,
      [tenantId, monthStr]
    );

    const prevTotal = usageResult.rows[0]?.visits_total || 0;
    const newTotal = prevTotal + parseInt(visitor_count);

    // Calculate overage fees
    let overageFees = 0;
    if (newTotal > BILLING_CONFIG.VISIT_LIMIT) {
      const overageAmount = newTotal - BILLING_CONFIG.VISIT_LIMIT;
      const increments = Math.ceil(overageAmount / BILLING_CONFIG.OVERAGE_INCREMENT);
      overageFees = increments * BILLING_CONFIG.OVERAGE_FEE_CENTS;
    }

    await this.db.queryInSchema('public',
      `INSERT INTO tenant_usage (tenant_id, month_year, visits_total, overage_fees_cents, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (tenant_id, month_year) DO UPDATE SET
        visits_total = EXCLUDED.visits_total,
        overage_fees_cents = EXCLUDED.overage_fees_cents,
        updated_at = NOW()`,
      [tenantId, monthStr, newTotal, overageFees]
    );

    return {
      date: dateStr,
      revenue: total_revenue,
      bookings: booking_count,
      visitors: visitor_count,
    };
  }
}
