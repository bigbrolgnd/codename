import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseManager } from './index';
import * as fs from 'fs';

const mClient = {
  query: vi.fn(),
  release: vi.fn(),
};

const mPool = {
  connect: vi.fn(() => Promise.resolve(mClient)),
  query: vi.fn(),
  end: vi.fn(),
};

vi.mock('pg', () => {
  return {
    Pool: vi.fn().mockImplementation(function() {
      return mPool;
    }),
  };
});

vi.mock('fs', () => {
  return {
    readFileSync: vi.fn(),
  };
});

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;

  beforeEach(() => {
    vi.clearAllMocks();
    dbManager = new DatabaseManager();
  });

  it('creates a tenant schema safely', async () => {
    await dbManager.createTenantSchema('tenant_123');
    expect(mClient.query).toHaveBeenCalledWith('CREATE SCHEMA IF NOT EXISTS tenant_123');
  });

  it('throws error for invalid schema name', async () => {
    await expect(dbManager.createTenantSchema('invalid-schema; DROP TABLE users;'))
      .rejects.toThrow('Invalid schema name');
  });

  it('sets search path and executes query in schema', async () => {
    await dbManager.queryInSchema('tenant_456', 'SELECT * FROM services');
    
    expect(mClient.query).toHaveBeenCalledWith('SET search_path TO tenant_456');
    expect(mClient.query).toHaveBeenCalledWith('SELECT * FROM services', []);
    expect(mClient.query).toHaveBeenCalledWith('SET search_path TO public');
  });

  it('runs migrations in a specific schema', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue('CREATE TABLE test (id int);');

    await dbManager.runMigrations('tenant_789');

    expect(mClient.query).toHaveBeenCalledWith('SET search_path TO tenant_789');
    expect(mClient.query).toHaveBeenCalledWith('CREATE TABLE test (id int);', []);
    expect(mClient.query).toHaveBeenCalledWith('SET search_path TO public');
  });

  it('fails to query reviews table before migration', async () => {
    // Mock failure for non-existent table
    mClient.query.mockRejectedValueOnce(new Error('relation "reviews" does not exist'));

    await expect(dbManager.queryInSchema('tenant_test', 'SELECT * FROM reviews'))
      .rejects.toThrow('relation "reviews" does not exist');
  });

  it('runs the reviews migration', async () => {
    vi.mocked(fs.readFileSync).mockReturnValue('CREATE TABLE reviews (id int);');

    await dbManager.runMigrations('tenant_abc', '004_reviews_init.sql');

    expect(mClient.query).toHaveBeenCalledWith('SET search_path TO tenant_abc');
    expect(mClient.query).toHaveBeenCalledWith('CREATE TABLE reviews (id);', []);
  });

  // Pricing Config Tests
  describe('getPricingConfig', () => {
    it('returns all active pricing config entries ordered by category and name', async () => {
      const mockRows = [
        { addon_id: 'smart-calendar', name: 'Smart Calendar', category: 'premium', price_cents: 1499, is_active: true },
        { addon_id: 'instagram-feed', name: 'Instagram Feed', category: 'free', price_cents: 0, is_active: true },
      ];
      mPool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await dbManager.getPricingConfig();

      expect(mPool.query).toHaveBeenCalledWith(
        'SELECT * FROM public.pricing_config WHERE is_active = TRUE ORDER BY category, name'
      );
      expect(result).toEqual(mockRows);
    });

    it('throws error with context when database query fails', async () => {
      mPool.query.mockRejectedValueOnce(new Error('Connection lost'));

      await expect(dbManager.getPricingConfig()).rejects.toThrow('Failed to fetch pricing configuration');
    });
  });

  // Tenant Addons Tests
  describe('getTenantAddons', () => {
    it('returns all active add-ons for a tenant with pricing details', async () => {
      const mockRows = [
        {
          addon_id: 'smart-calendar',
          name: 'Smart Calendar',
          category: 'premium',
          price_cents: 1499,
          is_active: true,
        },
      ];
      mPool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await dbManager.getTenantAddons('tenant_123');

      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN public.pricing_config'),
        ['tenant_123']
      );
      expect(result).toEqual(mockRows);
    });

    it('throws error with context when tenant addons query fails', async () => {
      mPool.query.mockRejectedValueOnce(new Error('Tenant not found'));

      await expect(dbManager.getTenantAddons('tenant_404')).rejects.toThrow('Failed to fetch tenant add-ons');
    });
  });

  // Subscribe To Addon Tests
  describe('subscribeToAddon', () => {
    it('creates new subscription with upsert on conflict', async () => {
      const mockRow = {
        id: 'sub-123',
        tenant_id: 'tenant_456',
        addon_id: 'smart-calendar',
        is_active: true,
      };
      mPool.query.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await dbManager.subscribeToAddon('tenant_456', 'smart-calendar', 'stripe_item_123');

      expect(mPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (tenant_id, addon_id)'),
        ['tenant_456', 'smart-calendar', 'stripe_item_123']
      );
      expect(result).toEqual(mockRow);
    });

    it('handles null stripe subscription item id', async () => {
      const mockRow = { id: 'sub-456', tenant_id: 'tenant_789', addon_id: 'instagram-feed', is_active: true };
      mPool.query.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await dbManager.subscribeToAddon('tenant_789', 'instagram-feed');

      expect(mPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['tenant_789', 'instagram-feed', null]
      );
      expect(result).toEqual(mockRow);
    });

    it('throws error with context when subscription fails', async () => {
      mPool.query.mockRejectedValueOnce(new Error('Foreign key violation'));

      await expect(dbManager.subscribeToAddon('tenant_999', 'invalid-addon')).rejects.toThrow('Failed to subscribe to add-on');
    });
  });

  // Update Base Plan Tests
  describe('updateBasePlan', () => {
    it('updates tenant base plan with validation', async () => {
      const mockRow = {
        schema_name: 'tenant_abc',
        base_plan_type: 'standard',
        updated_at: new Date().toISOString(),
      };
      mPool.query.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await dbManager.updateBasePlan('tenant_abc', 'standard');

      expect(mPool.query).toHaveBeenCalledWith(
        'UPDATE public.tenants SET base_plan_type = $1, updated_at = NOW() WHERE schema_name = $2 RETURNING *',
        ['standard', 'tenant_abc']
      );
      expect(result).toEqual(mockRow);
    });

    it('throws error for invalid plan type', async () => {
      await expect(dbManager.updateBasePlan('tenant_123', 'invalid_plan' as any)).rejects.toThrow(
        "Invalid plan_type: invalid_plan. Must be one of: free, standard, ai_powered"
      );
    });

    it('throws error with context when database update fails', async () => {
      mPool.query.mockResolvedValueOnce({ rows: [] }); // No rows returned

      await expect(dbManager.updateBasePlan('tenant_404', 'free')).rejects.toThrow('Failed to update base plan');
    });

    it('validates all valid plan types', async () => {
      const validPlans: Array<'free' | 'standard' | 'ai_powered'> = ['free', 'standard', 'ai_powered'];
      const mockRow = { schema_name: 'tenant_test', base_plan_type: 'free' };

      for (const plan of validPlans) {
        mPool.query.mockResolvedValueOnce({ rows: [{ ...mockRow, base_plan_type: plan }] });
        const result = await dbManager.updateBasePlan('tenant_test', plan);
        expect(result.base_plan_type).toBe(plan);
      }
    });
  });
});