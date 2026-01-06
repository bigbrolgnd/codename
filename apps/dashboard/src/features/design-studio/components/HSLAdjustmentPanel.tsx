/**
 * HSL Adjustment Panel Component
 * Global color shift controls for hue, saturation, and lightness.
 */

import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useThemeEditor } from '../hooks/useThemeEditor';
import { hslPresets } from '../config/default-theme';

export function HSLAdjustmentPanel() {
  const { themeState, setHSLAdjustments, resetHSLAdjustments } = useThemeEditor();
  const { hslAdjustments } = themeState;

  const handleHueChange = useCallback(
    (value: number[]) => {
      setHSLAdjustments({ hueShift: value[0] });
    },
    [setHSLAdjustments]
  );

  const handleSaturationChange = useCallback(
    (value: number[]) => {
      setHSLAdjustments({ saturationScale: value[0] });
    },
    [setHSLAdjustments]
  );

  const handleLightnessChange = useCallback(
    (value: number[]) => {
      setHSLAdjustments({ lightnessScale: value[0] });
    },
    [setHSLAdjustments]
  );

  const applyPreset = useCallback(
    (preset: (typeof hslPresets)[0]) => {
      setHSLAdjustments({
        hueShift: preset.hueShift,
        saturationScale: preset.saturationScale,
        lightnessScale: preset.lightnessScale,
      });
    },
    [setHSLAdjustments]
  );

  const isDefault =
    hslAdjustments.hueShift === 0 &&
    hslAdjustments.saturationScale === 1 &&
    hslAdjustments.lightnessScale === 1;

  return (
    <div className="space-y-4">
      {/* Hue Shift */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Hue Shift</Label>
          <span className="text-xs text-muted-foreground font-mono">
            {hslAdjustments.hueShift > 0 ? '+' : ''}
            {hslAdjustments.hueShift}°
          </span>
        </div>
        <Slider
          value={[hslAdjustments.hueShift]}
          onValueChange={handleHueChange}
          min={-180}
          max={180}
          step={1}
          className="w-full"
        />
      </div>

      {/* Saturation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Saturation</Label>
          <span className="text-xs text-muted-foreground font-mono">
            {hslAdjustments.saturationScale.toFixed(2)}x
          </span>
        </div>
        <Slider
          value={[hslAdjustments.saturationScale]}
          onValueChange={handleSaturationChange}
          min={0}
          max={2}
          step={0.01}
          className="w-full"
        />
      </div>

      {/* Lightness */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Lightness</Label>
          <span className="text-xs text-muted-foreground font-mono">
            {hslAdjustments.lightnessScale.toFixed(2)}x
          </span>
        </div>
        <Slider
          value={[hslAdjustments.lightnessScale]}
          onValueChange={handleLightnessChange}
          min={0.2}
          max={2}
          step={0.01}
          className="w-full"
        />
      </div>

      {/* Reset Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={resetHSLAdjustments}
        disabled={isDefault}
      >
        <RotateCcw className="h-3 w-3 mr-2" />
        Reset Adjustments
      </Button>

      {/* Quick Presets */}
      <div className="pt-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Quick Presets
        </Label>
        <div className="flex flex-wrap gap-1 mt-2">
          {hslPresets.slice(0, 10).map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
