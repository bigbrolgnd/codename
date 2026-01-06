import { describe, it, expect, vi, beforeEach } from 'vitest';
import { marketingRouter } from './marketing.router';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database', () => {
  const DatabaseManager = vi.fn();
  DatabaseManager.prototype.query = vi.fn();
  DatabaseManager.prototype.queryInSchema = vi.fn();
  return { DatabaseManager };
});

describe('marketingRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects getSettings if tenant does not exist', async () => {
    vi.spyOn(DatabaseManager.prototype, 'query').mockResolvedValue({ rows: [] } as any);

    const caller = marketingRouter.createCaller({});

    await expect(caller.getSettings({
      tenantId: 'tenant_nonexistent'
    })).rejects.toThrow(/Tenant not found/);
  });

  it('returns settings for valid tenant', async () => {
    const mockQuery = vi.spyOn(DatabaseManager.prototype, 'query');
    const mockQueryInSchema = vi.spyOn(DatabaseManager.prototype, 'queryInSchema');

    // Mock tenant validation
    mockQuery.mockResolvedValueOnce({ rows: [{ schema_name: 'tenant_test' }] } as any);

    // Mock getSettings
    mockQueryInSchema.mockResolvedValue({
      rows: [{
        auto_pilot_enabled: false,
        frequency: 'weekly',
        tone: 'professional',
        platforms: ['google'],
        next_post_at: null
      }]
    } as any);

    const caller = marketingRouter.createCaller({});
    const result = await caller.getSettings({ tenantId: 'tenant_test' });

    expect(result.autoPilotEnabled).toBe(false);
    expect(result.frequency).toBe('weekly');
  });

  it('rejects update if auto-pilot enabled but no platforms selected', async () => {
    const caller = marketingRouter.createCaller({});

    await expect(caller.updateSettings({
      tenantId: 'tenant_test',
      settings: {
        autoPilotEnabled: true,
        frequency: 'weekly',
        tone: 'professional',
        platforms: []
      }
    })).rejects.toThrow(/At least one platform/);
  });

  it('rejects update if tenant does not exist', async () => {
    vi.spyOn(DatabaseManager.prototype, 'query').mockResolvedValue({ rows: [] } as any);

    const caller = marketingRouter.createCaller({});

    await expect(caller.updateSettings({
      tenantId: 'tenant_nonexistent',
      settings: {
        autoPilotEnabled: true,
        frequency: 'weekly',
        tone: 'professional',
        platforms: ['google']
      }
    })).rejects.toThrow(/Tenant not found/);
  });

  it('allows update if auto-pilot enabled and platform selected', async () => {
    const mockQuery = vi.spyOn(DatabaseManager.prototype, 'query');
    const mockQueryInSchema = vi.spyOn(DatabaseManager.prototype, 'queryInSchema');

    // Mock tenant validation
    mockQuery.mockResolvedValueOnce({ rows: [{ schema_name: 'tenant_test' }] } as any);

    // Mock updateSettings
    mockQueryInSchema.mockResolvedValue({
      rows: [{
        auto_pilot_enabled: true,
        frequency: 'weekly',
        tone: 'professional',
        platforms: ['google'],
        next_post_at: new Date()
      }]
    } as any);

    const caller = marketingRouter.createCaller({});

    const result = await caller.updateSettings({
      tenantId: 'tenant_test',
      settings: {
        autoPilotEnabled: true,
        frequency: 'weekly',
        tone: 'professional',
        platforms: ['google']
      }
    });

    expect(result.autoPilotEnabled).toBe(true);
  });
});
