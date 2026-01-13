import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReferralService } from './referral.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database', () => ({
  DatabaseManager: vi.fn(),
}));

describe('ReferralService', () => {
  let referralService: ReferralService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      query: vi.fn(),
    };
    referralService = new ReferralService(mockDb as unknown as DatabaseManager);
  });

  describe('generateReferralCode', () => {
    it('generates a unique referral code based on tenantId', () => {
      const tenantId = 'test-tenant';
      const code = referralService.generateReferralCode(tenantId);
      expect(code).toContain('test-tenant');
      expect(code.length).toBeGreaterThan(tenantId.length);
    });
  });

  describe('validateReferralCode', () => {
    it('returns true for valid code', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: '123' }] });
      const isValid = await referralService.validateReferralCode('social_test-tenant');
      expect(isValid).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM public.tenants'),
        expect.arrayContaining(['test-tenant'])
      );
    });

    it('returns false for invalid code', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      const isValid = await referralService.validateReferralCode('invalid_code');
      expect(isValid).toBe(false);
    });
  });

  describe('trackReferral', () => {
    it('creates a pending referral record', async () => {
      const referrerId = 'referrer-1';
      const refereeId = 'referee-1';
      
      mockDb.query.mockResolvedValueOnce({ rowCount: 1 });

      await referralService.trackReferral(referrerId, refereeId);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.referral_program'),
        expect.arrayContaining([referrerId, refereeId, expect.stringContaining('social_')])
      );
    });
  });

  describe('processReferralReward', () => {
    it('processes rewards and updates status', async () => {
      const refereeId = 'referee-1';
      
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 'ref-1', referrer_tenant_id: 'referrer-1' }] }) // check existing
        .mockResolvedValueOnce({ rowCount: 1 }) // update status
        .mockResolvedValue({ rowCount: 1 }); // update tenants (x2)

      const rewards = await referralService.processReferralReward(refereeId);

      expect(rewards).toEqual({ referrerReward: 1, refereeReward: 1 });
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.referral_program'),
        expect.arrayContaining([refereeId])
      );
      
      // Check tenant update
      expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE public.tenants'),
          expect.anything()
      );
    });
  });
  
  describe('getReferralStats', () => {
      it('returns correct stats', async () => {
          const tenantId = 'referrer-1';
          mockDb.query.mockResolvedValueOnce({ rows: [{ total_referrals: '5', pending_referrals: '2', months_earned: '5' }] });
          
          const stats = await referralService.getReferralStats(tenantId);
          expect(stats).toEqual({
              totalReferrals: 5,
              pendingReferrals: 2,
              monthsEarned: 5
          });
      });
  });
});
