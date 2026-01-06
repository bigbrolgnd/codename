import { describe, it, expect, beforeEach, vi } from 'vitest';
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
});
