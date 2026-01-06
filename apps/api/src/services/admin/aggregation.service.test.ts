import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AggregationService } from './aggregation.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database');

describe('AggregationService', () => {
  let service: AggregationService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = new DatabaseManager();
    service = new AggregationService(mockDb);
  });

  it('aggregates daily stats from raw logs', async () => {
    const tenantId = 'tenant_test';
    const date = '2026-01-05';

    // Mock Booking aggregates
    mockDb.queryInSchema.mockImplementation((schema: string, query: string) => {
      if (query.includes('FROM bookings')) {
        return Promise.resolve({ rows: [{ booking_count: 5, total_revenue: 50000 }] });
      }
      if (query.includes('FROM visit_logs')) {
        return Promise.resolve({ rows: [{ visitor_count: 100, top_city: 'New York' }] });
      }
      if (query.includes('FROM reviews')) {
        return Promise.resolve({ rows: [{ review_count: 2, avg_rating: 4.5 }] });
      }
      return Promise.resolve({ rows: [] });
    });

    const result = await service.aggregateDailyStats(tenantId, date);

    expect(result.bookings).toBe(5);
    expect(result.revenue).toBe(50000);
    expect(result.visitors).toBe(100);
    
    // Verify review stats included in upsert
    expect(mockDb.queryInSchema).toHaveBeenCalledWith(tenantId, expect.stringContaining('avg_rating, total_reviews'), expect.arrayContaining([4.5, 2]));
  });

  it('calculates overage fees when traffic threshold is exceeded', async () => {
    const tenantId = 'tenant_overage';
    const date = '2026-01-05';

    // Mock DB responses
    mockDb.queryInSchema.mockImplementation((schema: string, query: string) => {
      if (query.includes('FROM bookings')) {
        return Promise.resolve({ rows: [{ booking_count: 1, total_revenue: 100 }] });
      }
      if (query.includes('FROM visit_logs')) {
        return Promise.resolve({ rows: [{ visitor_count: 5000, top_city: 'London' }] });
      }
      if (query.includes('FROM reviews')) {
        return Promise.resolve({ rows: [{ review_count: 0, avg_rating: 0 }] });
      }
      if (schema === 'public' && query.includes('SELECT visits_total FROM tenant_usage')) {
        // Assume we already had 46,000 visits this month
        return Promise.resolve({ rows: [{ visits_total: 46000 }] });
      }
      return Promise.resolve({ rows: [] });
    });

    await service.aggregateDailyStats(tenantId, date);

    // Total visits will be 46,000 + 5,000 = 51,000
    // Threshold is 50,000. Overage is 1,000.
    
    // Let's check the update to tenant_usage
    expect(mockDb.queryInSchema).toHaveBeenCalledWith('public', 
      expect.stringContaining('INSERT INTO tenant_usage'),
      expect.arrayContaining([tenantId, '2026-01-01', 51000, 1000])
    );
  });
});
