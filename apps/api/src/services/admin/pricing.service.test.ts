import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PricingService } from './pricing.service';
import { BillingService } from './billing.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database');
vi.mock('./billing.service');

describe('PricingService', () => {
  let pricingService: PricingService;
  let mockDb: any;
  let mockBillingService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = new DatabaseManager();
    mockBillingService = new BillingService(mockDb);
    pricingService = new PricingService(mockDb, mockBillingService);
  });

  describe('getAllPricing', () => {
    it('returns all active pricing configurations', async () => {
      const mockPricing = [
        { addon_id: 'smart-calendar', name: 'Smart Calendar', category: 'premium', price_cents: 2900, is_active: true },
        { addon_id: 'booking-system', name: 'Booking System', category: 'infrastructure', price_cents: 1900, is_active: true },
      ];

      mockDb.query.mockResolvedValue({ rows: mockPricing });

      const result = await pricingService.getAllPricing();

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM public.pricing_config WHERE is_active = TRUE ORDER BY category, name'
      );
      expect(result).toEqual(mockPricing);
    });

    it('throws error when database query fails', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(pricingService.getAllPricing()).rejects.toThrow('Failed to fetch pricing configurations');
    });
  });

  describe('getPricingByCategory', () => {
    it('returns pricing for valid category', async () => {
      const mockPricing = [
        { addon_id: 'smart-calendar', name: 'Smart Calendar', category: 'premium', price_cents: 2900, is_active: true },
      ];

      mockDb.query.mockResolvedValue({ rows: mockPricing });

      const result = await pricingService.getPricingByCategory('premium');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM public.pricing_config WHERE category = $1 AND is_active = TRUE ORDER BY name',
        ['premium']
      );
      expect(result).toEqual(mockPricing);
    });

    it('throws error for invalid category', async () => {
      await expect(pricingService.getPricingByCategory('invalid')).rejects.toThrow(
        'Invalid category: invalid. Must be one of: free, premium, ai, infrastructure'
      );
    });
  });

  describe('subscribeToAddon', () => {
    it('throws error for invalid tenantId format', async () => {
      await expect(pricingService.subscribeToAddon('invalid-tenant', 'smart-calendar')).rejects.toThrow(
        'Invalid tenantId format'
      );
    });

    it('throws error for invalid tenantId format (missing tenant_ prefix)', async () => {
      await expect(pricingService.subscribeToAddon('test123', 'smart-calendar')).rejects.toThrow(
        'Invalid tenantId format'
      );
    });

    it('throws error for invalid tenantId format (uppercase)', async () => {
      await expect(pricingService.subscribeToAddon('tenant_Test', 'smart-calendar')).rejects.toThrow(
        'Invalid tenantId format'
      );
    });

    it('throws error when addon does not exist', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await expect(pricingService.subscribeToAddon('tenant_test', 'nonexistent')).rejects.toThrow(
        'Add-on not found: nonexistent'
      );
    });

    it('subscribes tenant to add-on with Stripe subscription item', async () => {
      const mockAddon = { addon_id: 'smart-calendar', name: 'Smart Calendar', is_active: true };
      const mockTenantAddon = { id: '1', tenant_id: 'tenant_test', addon_id: 'smart-calendar', is_active: true };

      mockDb.query.mockResolvedValueOnce({ rows: [mockAddon] });
      mockDb.subscribeToAddon.mockResolvedValue(mockTenantAddon);
      mockBillingService.addSubscriptionItem.mockResolvedValue('sub_item_123');

      const result = await pricingService.subscribeToAddon('tenant_test', 'smart-calendar');

      expect(result).toEqual({
        ...mockTenantAddon,
        stripeSubscriptionItemId: 'sub_item_123',
      });
      expect(mockBillingService.addSubscriptionItem).toHaveBeenCalledWith('tenant_test', 'smart-calendar');
    });

    it('subscribes tenant to add-on without Stripe when billing service unavailable', async () => {
      const pricingServiceNoBilling = new PricingService(mockDb);
      const mockAddon = { addon_id: 'smart-calendar', name: 'Smart Calendar', is_active: true };
      const mockTenantAddon = { id: '1', tenant_id: 'tenant_test', addon_id: 'smart-calendar', is_active: true };

      mockDb.query.mockResolvedValueOnce({ rows: [mockAddon] });
      mockDb.subscribeToAddon.mockResolvedValue(mockTenantAddon);

      const result = await pricingServiceNoBilling.subscribeToAddon('tenant_test', 'smart-calendar');

      expect(result).toEqual({
        ...mockTenantAddon,
        stripeSubscriptionItemId: undefined,
      });
    });

    it('continues with database record even if Stripe fails', async () => {
      const mockAddon = { addon_id: 'smart-calendar', name: 'Smart Calendar', is_active: true };
      const mockTenantAddon = { id: '1', tenant_id: 'tenant_test', addon_id: 'smart-calendar', is_active: true };

      mockDb.query.mockResolvedValueOnce({ rows: [mockAddon] });
      mockDb.subscribeToAddon.mockResolvedValue(mockTenantAddon);
      mockBillingService.addSubscriptionItem.mockRejectedValue(new Error('Stripe API error'));

      const result = await pricingService.subscribeToAddon('tenant_test', 'smart-calendar');

      expect(result).toEqual({
        ...mockTenantAddon,
        stripeSubscriptionItemId: undefined,
      });
    });
  });

  describe('unsubscribeFromAddon', () => {
    it('throws error for invalid tenantId format', async () => {
      await expect(pricingService.unsubscribeFromAddon('invalid-tenant', 'smart-calendar')).rejects.toThrow(
        'Invalid tenantId format'
      );
    });

    it('unsubscribes tenant from add-on', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ id: '1' }] });

      await pricingService.unsubscribeFromAddon('tenant_test', 'smart-calendar');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.tenant_addons'),
        ['tenant_test', 'smart-calendar']
      );
    });

    it('throws error when active subscription not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      await expect(pricingService.unsubscribeFromAddon('tenant_test', 'smart-calendar')).rejects.toThrow(
        'Active subscription not found'
      );
    });
  });

  describe('getTenantAddons', () => {
    it('throws error for invalid tenantId format', async () => {
      await expect(pricingService.getTenantAddons('invalid-tenant')).rejects.toThrow(
        'Invalid tenantId format'
      );
    });

    it('returns tenant add-ons', async () => {
      const mockAddons = [
        { id: '1', tenant_id: 'tenant_test', addon_id: 'smart-calendar', is_active: true },
      ];

      mockDb.getTenantAddons.mockResolvedValue(mockAddons);

      const result = await pricingService.getTenantAddons('tenant_test');

      expect(result).toEqual(mockAddons);
    });
  });

  describe('calculateMonthlyTotal', () => {
    it('throws error for invalid tenantId format', async () => {
      await expect(pricingService.calculateMonthlyTotal('invalid-tenant')).rejects.toThrow(
        'Invalid tenantId format'
      );
    });

    it('calculates total for free tier', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ base_plan_type: 'free' }] })
        .mockResolvedValueOnce({ rows: [] });

      const total = await pricingService.calculateMonthlyTotal('tenant_test');

      expect(total).toBe(0);
    });

    it('calculates total for standard plan', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ base_plan_type: 'standard' }] })
        .mockResolvedValueOnce({ rows: [] });

      const total = await pricingService.calculateMonthlyTotal('tenant_test');

      expect(total).toBe(3900); // $39.00 in cents
    });

    it('calculates total for ai_powered plan (includes all add-ons)', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ base_plan_type: 'ai_powered' }] })
        .mockResolvedValueOnce({ rows: [] });

      const total = await pricingService.calculateMonthlyTotal('tenant_test');

      expect(total).toBe(7900); // $79.00 in cents
    });

    it('calculates total with add-ons for standard plan', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ base_plan_type: 'standard' }] })
        .mockResolvedValueOnce({
          rows: [
            { price_cents: 2900 }, // Smart Calendar
            { price_cents: 1900 }, // Booking System
          ],
        });

      const total = await pricingService.calculateMonthlyTotal('tenant_test');

      expect(total).toBe(8700); // 3900 + 2900 + 1900
    });
  });
});
