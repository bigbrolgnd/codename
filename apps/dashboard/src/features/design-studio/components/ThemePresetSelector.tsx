/**
 * Theme Preset Selector Component
 * Dropdown for selecting pre-built theme presets.
 */

import { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useThemeEditor } from '../hooks/useThemeEditor';
import { themePresets, presetCategories, getPresetsByCategory } from '../config/presets';

export function ThemePresetSelector() {
  const { themeState, applyPreset } = useThemeEditor();

  const handlePresetChange = useCallback(
    (presetId: string) => {
      const preset = themePresets.find((p) => p.id === presetId);
      if (preset) {
        applyPreset(preset.id, preset.styles);
      }
    },
    [applyPreset]
  );

  return (
    <Select value={themeState.presetId || ''} onValueChange={handlePresetChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Choose a preset..." />
      </SelectTrigger>
      <SelectContent>
        {presetCategories.map((category) => {
          const presets = getPresetsByCategory(category.id);
          if (presets.length === 0) return null;

          return (
            <SelectGroup key={category.id}>
              <SelectLabel>{category.label}</SelectLabel>
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center gap-2">
                    {/* Color preview dots */}
                    <div className="flex gap-0.5">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: preset.styles.light.primary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: preset.styles.light.secondary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: preset.styles.light.accent }}
                      />
                    </div>
                    <span>{preset.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
