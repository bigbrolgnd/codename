import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ThemeService } from './theme.service';
import { DatabaseManager } from '@codename/database';

describe('ThemeService', () => {
  let themeService: ThemeService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      queryInSchema: vi.fn(),
    };
    themeService = new ThemeService(mockDb as unknown as DatabaseManager);
  });

  it('getTheme returns null if no theme found', async () => {
    mockDb.queryInSchema.mockResolvedValue({ rows: [] });
    const result = await themeService.getTheme('tenant_test');
    expect(result.theme).toBeNull();
  });

  it('saveTheme inserts new version and returns it', async () => {
    // Mock latest version check
    mockDb.queryInSchema.mockResolvedValueOnce({ rows: [{ version: 5 }] });
    
    // Mock insert
    const mockTheme = {
      id: 'uuid-1',
      styles: { light: {}, dark: {} },
      hsl_adjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
      preset_id: 'minimal',
      version: 6,
      is_draft: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    mockDb.queryInSchema.mockResolvedValueOnce({ rows: [mockTheme] });

    const result = await themeService.saveTheme('tenant_test', {
      styles: { light: {}, dark: {} },
      hslAdjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
      presetId: 'minimal',
    } as any);

    expect(result.success).toBe(true);
    expect(result.theme?.version).toBe(6);
    expect(mockDb.queryInSchema).toHaveBeenCalledTimes(2);
  });

  it('publishTheme marks latest as published', async () => {
    const mockTheme = {
      id: 'uuid-pub',
      styles: { light: {}, dark: {} },
      hsl_adjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
      version: 1,
      is_draft: false,
      published_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockDb.queryInSchema.mockResolvedValueOnce({ rows: [mockTheme] });

    const result = await themeService.publishTheme('tenant_test', 'uuid-pub');

    expect(result.success).toBe(true);
    expect(result.theme?.isDraft).toBe(false);
    expect(result.theme?.publishedAt).not.toBeNull();
    expect(mockDb.queryInSchema).toHaveBeenCalledWith(
      'tenant_test',
      expect.stringMatching(/UPDATE\s+theme_customizations\s+SET\s+is_draft\s+=\s+FALSE/i),
      ['uuid-pub']
    );
  });

  describe('n8n orchestration integration', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      // Store original environment
      originalEnv = process.env;
      // Mock environment for testing
      process.env.N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook/test';
      process.env.ORCHESTRATION_SECRET = 'test-secret';
    });

    afterEach(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    it('generates CSS and includes it in orchestration payload', async () => {
      const mockTheme = {
        id: 'uuid-pub',
        styles: {
          light: { 'background-primary': '#ffffff' },
          dark: { 'background-primary': '#000000' }
        },
        hsl_adjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
        version: 2,
        is_draft: false,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryInSchema.mockResolvedValueOnce({ rows: [mockTheme] });

      // Mock fetch to capture the payload
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'Success'
      });
      global.fetch = mockFetch as any;

      await themeService.publishTheme('tenant_123', 'uuid-pub');

      // Verify fetch was called with CSS in payload
      expect(mockFetch).toHaveBeenCalled();
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.event).toBe('THEME_PUBLISHED');
      expect(body.payload.css).toBeTruthy();
      expect(body.payload.css).toContain('--background-primary:');
      expect(body.payload.tenantId).toBe('tenant_123');
      expect(body.payload.version).toBe(2);
      expect(body.payload.generatedAt).toBeTruthy();
    });

    it('validates theme data before orchestration', async () => {
      // Missing styles
      const invalidTheme1 = {
        id: 'uuid-invalid',
        styles: null,
        hsl_adjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
        version: 1,
        is_draft: false,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryInSchema.mockResolvedValueOnce({ rows: [invalidTheme1] });

      await expect(themeService.publishTheme('tenant_test', 'uuid-invalid'))
        .rejects.toThrow('Invalid theme data: styles must be an object');

      // Missing hsl_adjustments
      const invalidTheme2 = {
        id: 'uuid-invalid2',
        styles: { light: {}, dark: {} },
        hsl_adjustments: null,
        version: 1,
        is_draft: false,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryInSchema.mockResolvedValueOnce({ rows: [invalidTheme2] });

      await expect(themeService.publishTheme('tenant_test', 'uuid-invalid2'))
        .rejects.toThrow('Invalid theme data: hsl_adjustments must be an object');
    });

    it('handles missing N8N_WEBHOOK_URL gracefully', async () => {
      delete process.env.N8N_WEBHOOK_URL;

      const mockTheme = {
        id: 'uuid-pub',
        styles: { light: {}, dark: {} },
        hsl_adjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
        version: 1,
        is_draft: false,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryInSchema.mockResolvedValueOnce({ rows: [mockTheme] });

      // Should not throw even without webhook URL
      const result = await themeService.publishTheme('tenant_test', 'uuid-pub');

      expect(result.success).toBe(true);
    });

    it('retries webhook on failure with exponential backoff', async () => {
      const mockTheme = {
        id: 'uuid-pub',
        styles: { light: {}, dark: {} },
        hsl_adjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
        version: 1,
        is_draft: false,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryInSchema.mockResolvedValueOnce({ rows: [mockTheme] });

      // Mock fetch to fail twice then succeed
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'Success'
        });

      global.fetch = mockFetch as any;

      // Mock setTimeout for testing
      vi.useFakeTimers();

      const publishPromise = themeService.publishTheme('tenant_test', 'uuid-pub');

      // Fast-forward through retries
      await vi.runAllTimersAsync();

      await publishPromise;

      // Should have been called 3 times (2 failures + 1 success)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('logs orchestration events for audit trail', async () => {
      const mockTheme = {
        id: 'uuid-pub',
        styles: { light: {}, dark: {} },
        hsl_adjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
        version: 1,
        is_draft: false,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryInSchema.mockResolvedValueOnce({ rows: [mockTheme] });

      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'Success'
      });
      global.fetch = mockFetch as any;

      await themeService.publishTheme('tenant_123', 'uuid-pub');

      // Verify orchestration logging
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ORCHESTRATION]')
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('tenant_123')
      );

      consoleInfoSpy.mockRestore();
    });
  });
});
