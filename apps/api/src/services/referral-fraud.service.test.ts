import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReferralFraudService } from './referral-fraud.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database', () => ({
  DatabaseManager: vi.fn(),
}));

describe('ReferralFraudService', () => {
  let fraudService: ReferralFraudService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      query: vi.fn(),
    };
    fraudService = new ReferralFraudService(mockDb as unknown as DatabaseManager);
  });

  describe('checkSuspiciousActivity', () => {
    it('returns false when no suspicious activity found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '5' }] }); // Normal count
      const isSuspicious = await fraudService.checkSuspiciousActivity('tenant-1');
      expect(isSuspicious).toBe(false);
    });
    
    it('returns true when rapid referrals detected', async () => {
         mockDb.query.mockResolvedValueOnce({ rows: [{ count: '15' }] }); // > 10 per month limit
         const isSuspicious = await fraudService.checkSuspiciousActivity('tenant-1');
         expect(isSuspicious).toBe(true);
    });
  });

  describe('validateRefereePayment', () => {
      it('returns true for valid payment status', async () => {
          // Mock checking tenant subscription status (e.g. from tenants table or subscription table)
          mockDb.query.mockResolvedValueOnce({ rows: [{ status: 'active' }] });
          const isValid = await fraudService.validateRefereePayment('referee-1');
          expect(isValid).toBe(true);
      });

      it('returns false for invalid/missing payment', async () => {
        mockDb.query.mockResolvedValueOnce({ rows: [] });
        const isValid = await fraudService.validateRefereePayment('referee-1');
        expect(isValid).toBe(false);
    });
  });
});
