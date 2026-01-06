/**
 * Shape Editor Component
 * Controls for border radius and shadow properties.
 */

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useThemeEditor } from '../hooks/useThemeEditor';

interface ShapeEditorProps {
  mode: 'light' | 'dark';
}

export function ShapeEditor({ mode }: ShapeEditorProps) {
  const { themeState, setStyleProperty } = useThemeEditor();
  const currentStyles = themeState.styles[mode];

  // Parse current values
  const radius = parseFloat(currentStyles.radius || '0.5');
  const shadowBlur = parseFloat(currentStyles['shadow-blur'] || '3');
  const shadowOpacity = parseFloat(currentStyles['shadow-opacity'] || '0.1');
  const shadowOffsetY = parseFloat(currentStyles['shadow-offset-y'] || '1');

  // Fallback for malformed data
  const safeRadius = isNaN(radius) ? 0.5 : radius;
  const safeShadowBlur = isNaN(shadowBlur) ? 3 : shadowBlur;
  const safeShadowOpacity = isNaN(shadowOpacity) ? 0.1 : shadowOpacity;
  const safeShadowOffsetY = isNaN(shadowOffsetY) ? 1 : shadowOffsetY;

  const handleRadiusChange = useCallback(
    (value: number[]) => {
      setStyleProperty(mode, 'radius', `${value[0]}rem`);
    },
    [mode, setStyleProperty]
  );

  const handleShadowBlurChange = useCallback(
    (value: number[]) => {
      setStyleProperty(mode, 'shadow-blur', `${value[0]}px`);
    },
    [mode, setStyleProperty]
  );

  const handleShadowOpacityChange = useCallback(
    (value: number[]) => {
      setStyleProperty(mode, 'shadow-opacity', value[0].toString());
    },
    [mode, setStyleProperty]
  );

  const handleShadowOffsetChange = useCallback(
    (value: number[]) => {
      setStyleProperty(mode, 'shadow-offset-y', `${value[0]}px`);
    },
    [mode, setStyleProperty]
  );

  return (
    <div className="space-y-6">
      {/* Border Radius */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Border Radius
          </Label>
          <span className="text-xs text-muted-foreground font-mono">{safeRadius.toFixed(2)}rem</span>
        </div>
        <Slider
          value={[safeRadius]}
          onValueChange={handleRadiusChange}
          min={0}
          max={2}
          step={0.125}
          className="w-full"
        />
        {/* Preview */}
        <div className="flex items-center gap-2 pt-2">
          <div
            className="w-8 h-8 bg-primary"
            style={{ borderRadius: `${safeRadius * 0.5}rem` }}
            title="Small"
          />
          <div
            className="w-12 h-12 bg-primary"
            style={{ borderRadius: `${safeRadius}rem` }}
            title="Medium"
          />
          <div
            className="w-16 h-16 bg-primary"
            style={{ borderRadius: `${safeRadius * 1.5}rem` }}
            title="Large"
          />
        </div>
      </div>

      {/* Shadow Controls */}
      <div className="space-y-4">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Shadow
        </Label>

        {/* Shadow Blur */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Blur</span>
            <span className="text-xs text-muted-foreground font-mono">{safeShadowBlur}px</span>
          </div>
          <Slider
            value={[safeShadowBlur]}
            onValueChange={handleShadowBlurChange}
            min={0}
            max={24}
            step={1}
            className="w-full"
          />
        </div>

        {/* Shadow Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Opacity</span>
            <span className="text-xs text-muted-foreground font-mono">
              {(safeShadowOpacity * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[safeShadowOpacity]}
            onValueChange={handleShadowOpacityChange}
            min={0}
            max={0.5}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Shadow Offset */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Y Offset</span>
            <span className="text-xs text-muted-foreground font-mono">{safeShadowOffsetY}px</span>
          </div>
          <Slider
            value={[safeShadowOffsetY]}
            onValueChange={handleShadowOffsetChange}
            min={0}
            max={12}
            step={1}
            className="w-full"
          />
        </div>

        {/* Shadow Preview */}
        <div className="pt-2 flex justify-center">
          <div
            className="w-24 h-16 bg-card rounded-lg"
            style={{
              boxShadow: `0 ${safeShadowOffsetY}px ${safeShadowBlur}px rgba(0,0,0,${safeShadowOpacity})`,
              borderRadius: `${safeRadius}rem`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
