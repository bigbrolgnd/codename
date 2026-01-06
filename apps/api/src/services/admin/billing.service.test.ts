import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService, usageCache } from './billing.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database');

describe('BillingService', () => {
  let service: BillingService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    usageCache.clear();
    mockDb = new DatabaseManager();
    service = new BillingService(mockDb);
  });

  it('checks AI cap correctly when under limit', async () => {
    mockDb.queryInSchema.mockResolvedValue({
      rows: [{ ai_tokens_used: 500 }] // $5.00
    });

    const isCapped = await service.checkAiCap('tenant_123');
    expect(isCapped).toBe(false);
  });

  it('checks AI cap correctly when at limit', async () => {
    mockDb.queryInSchema.mockResolvedValue({
      rows: [{ ai_tokens_used: 2000 }] // $20.00
    });

    const isCapped = await service.checkAiCap('tenant_123');
    expect(isCapped).toBe(true);
  });

  it('records AI usage with upsert', async () => {
    await service.recordAiUsage('tenant_123', 50);

    expect(mockDb.queryInSchema).toHaveBeenCalledWith('public',
      expect.stringContaining('INSERT INTO tenant_usage'),
      expect.arrayContaining(['tenant_123', 50])
    );
  });

  it('returns current month usage status', async () => {
    mockDb.queryInSchema.mockResolvedValueOnce({
      rows: [{ ai_tokens_used: 2000, visits_total: 1500 }]
    });

    const status = await service.getUsageStatus('tenant_test');
    expect(status.aiPercentage).toBe(100);
    expect(status.isCapped).toBe(true);
  });

  it('getSubscriptionStatus returns access info', async () => {
    mockDb.queryInSchema.mockResolvedValueOnce({
      rows: [{ plan_tier: 'pro', has_design_studio: false }]
    });

    const status = await service.getSubscriptionStatus('tenant_test');
    expect(status.planTier).toBe('pro');
    expect(status.canAccessDesignStudio).toBe(true);
  });

  it('getSubscriptionStatus handles basic tier without addon', async () => {
    mockDb.queryInSchema.mockResolvedValueOnce({
      rows: [{ plan_tier: 'basic', has_design_studio: false }]
    });

    const status = await service.getSubscriptionStatus('tenant_test');
    expect(status.canAccessDesignStudio).toBe(false);
  });

  it('subscribeToDesignStudio activates the addon', async () => {
    mockDb.queryInSchema.mockResolvedValueOnce({ rows: [] });
    const result = await service.subscribeToDesignStudio('tenant_test');
    expect(result.success).toBe(true);
    expect(mockDb.queryInSchema).toHaveBeenCalledWith(
      'public',
      expect.stringContaining('UPDATE tenants SET has_design_studio = TRUE'),
      ['tenant_test']
    );
  });
});