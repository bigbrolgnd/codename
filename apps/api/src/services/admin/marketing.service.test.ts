import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketingService } from './marketing.service';
import { DatabaseManager } from '@codename/database';

vi.mock('@codename/database');

describe('MarketingService', () => {
  let db: DatabaseManager;
  let service: MarketingService;

  beforeEach(() => {
    vi.clearAllMocks();
    db = new DatabaseManager();
    service = new MarketingService(db);
  });

  it('gets settings for a tenant', async () => {
    const mockRow = {
      auto_pilot_enabled: true,
      frequency: 'weekly',
      tone: 'enthusiastic',
      platforms: ['google', 'instagram'],
      next_post_at: new Date('2026-01-10T10:00:00Z')
    };

    vi.spyOn(db, 'queryInSchema').mockResolvedValue({ rows: [mockRow] } as any);

    const settings = await service.getSettings('tenant_test');

    expect(settings.autoPilotEnabled).toBe(true);
    expect(settings.frequency).toBe('weekly');
    expect(settings.tone).toBe('enthusiastic');
    expect(settings.platforms).toContain('instagram');
    expect(settings.nextPostAt).toBe(mockRow.next_post_at.toISOString());
  });

  it('updates settings and calculates next post date', async () => {
    const spy = vi.spyOn(db, 'queryInSchema').mockResolvedValue({ 
      rows: [{
        auto_pilot_enabled: true,
        frequency: 'bi-weekly',
        tone: 'educational',
        platforms: ['google'],
        next_post_at: new Date()
      }] 
    } as any);

    const update = {
      autoPilotEnabled: true,
      frequency: 'bi-weekly' as const,
      tone: 'educational' as const,
      platforms: ['google' as const]
    };

    await service.updateSettings('tenant_test', update);

    expect(spy).toHaveBeenCalledWith(
      'tenant_test',
      expect.stringContaining('UPDATE marketing_settings'),
      expect.arrayContaining([true, 'bi-weekly', 'educational', ['google'], expect.any(Date)])
    );
  });

  it('sets nextPostAt to null if auto-pilot is disabled', async () => {
    const spy = vi.spyOn(db, 'queryInSchema').mockResolvedValue({
      rows: [{ auto_pilot_enabled: false, frequency: 'weekly', tone: 'professional', platforms: [], next_post_at: null }]
    } as any);

    const update = {
      autoPilotEnabled: false,
      frequency: 'weekly' as const,
      tone: 'professional' as const,
      platforms: []
    };

    await service.updateSettings('tenant_test', update);

    const args = spy.mock.calls[0][2];
    expect(args[4]).toBeNull(); // next_post_at
  });

  it('rejects update if auto-pilot enabled but no platforms selected', async () => {
    const update = {
      autoPilotEnabled: true,
      frequency: 'weekly' as const,
      tone: 'professional' as const,
      platforms: []
    };

    await expect(service.updateSettings('tenant_test', update))
      .rejects.toThrow(/At least one platform must be selected/);
  });

  it('includes WHERE is_default = TRUE in UPDATE query', async () => {
    const spy = vi.spyOn(db, 'queryInSchema').mockResolvedValue({
      rows: [{
        auto_pilot_enabled: true,
        frequency: 'weekly',
        tone: 'professional',
        platforms: ['google'],
        next_post_at: new Date()
      }]
    } as any);

    const update = {
      autoPilotEnabled: true,
      frequency: 'weekly' as const,
      tone: 'professional' as const,
      platforms: ['google' as const]
    };

    await service.updateSettings('tenant_test', update);

    expect(spy).toHaveBeenCalledWith(
      'tenant_test',
      expect.stringContaining('WHERE is_default = TRUE'),
      expect.any(Array)
    );
  });

  it('calculates 14 days for bi-weekly frequency', async () => {
    const spy = vi.spyOn(db, 'queryInSchema').mockResolvedValue({ 
      rows: [{ auto_pilot_enabled: true, frequency: 'bi-weekly', tone: 'professional', platforms: ['google'], next_post_at: new Date() }] 
    } as any);

    const update = {
      autoPilotEnabled: true,
      frequency: 'bi-weekly' as const,
      tone: 'professional' as const,
      platforms: ['google' as const]
    };

    await service.updateSettings('tenant_test', update);
    const nextPostAt = spy.mock.calls[0][2][4];
    const diffDays = Math.round((nextPostAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(14);
  });
});
