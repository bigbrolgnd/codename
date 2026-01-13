import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from './analytics.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database', () => ({
  DatabaseManager: vi.fn(),
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      query: vi.fn(),
    };
    analyticsService = new AnalyticsService(mockDb as unknown as DatabaseManager);
  });

  describe('trackEvent', () => {
    it('inserts event into analytics_events', async () => {
      await analyticsService.trackEvent('test_event', { foo: 'bar' }, 'tenant-1');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.analytics_events'),
        expect.arrayContaining(['test_event', JSON.stringify({ foo: 'bar' }), 'tenant-1'])
      );
    });
  });

  describe('getKFactor', () => {
      it('calculates K-factor correctly', async () => {
          mockDb.query
            .mockResolvedValueOnce({ rows: [{ count: '100' }] }) // total customers
            .mockResolvedValueOnce({ rows: [{ count: '50' }] }) // total referrals sent
            .mockResolvedValueOnce({ rows: [{ count: '10' }] }); // total converted
            
          const k = await analyticsService.getKFactor();
          expect(k).toBe(0.1);
      });
  });
});
