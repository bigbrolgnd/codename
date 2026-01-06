/**
 * Typography Editor Component
 * Controls for font families and letter spacing.
 */

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useThemeEditor } from '../hooks/useThemeEditor';

interface TypographyEditorProps {
  mode: 'light' | 'dark';
}

/**
 * Common web-safe font stacks
 */
const FONT_STACKS = {
  sans: [
    { value: 'ui-sans-serif, system-ui, sans-serif', label: 'System Sans' },
    { value: 'Inter, ui-sans-serif, system-ui, sans-serif', label: 'Inter' },
    { value: 'Poppins, ui-sans-serif, system-ui, sans-serif', label: 'Poppins' },
    { value: 'Open Sans, ui-sans-serif, system-ui, sans-serif', label: 'Open Sans' },
    { value: 'Nunito, ui-sans-serif, system-ui, sans-serif', label: 'Nunito' },
    { value: 'Space Grotesk, ui-sans-serif, system-ui, sans-serif', label: 'Space Grotesk' },
  ],
  serif: [
    { value: 'ui-serif, Georgia, serif', label: 'System Serif' },
    { value: 'Playfair Display, ui-serif, Georgia, serif', label: 'Playfair Display' },
    { value: 'Merriweather, ui-serif, Georgia, serif', label: 'Merriweather' },
    { value: 'Lora, ui-serif, Georgia, serif', label: 'Lora' },
  ],
  mono: [
    { value: 'ui-monospace, monospace', label: 'System Mono' },
    { value: 'Fira Code, ui-monospace, monospace', label: 'Fira Code' },
    { value: 'JetBrains Mono, ui-monospace, monospace', label: 'JetBrains Mono' },
    { value: 'Source Code Pro, ui-monospace, monospace', label: 'Source Code Pro' },
  ],
};

export function TypographyEditor({ mode }: TypographyEditorProps) {
  const { themeState, setStyleProperty } = useThemeEditor();
  const currentStyles = themeState.styles[mode];

  const handleFontChange = useCallback(
    (fontType: 'font-sans' | 'font-serif' | 'font-mono', value: string) => {
      setStyleProperty(mode, fontType, value);
    },
    [mode, setStyleProperty]
  );

  const handleLetterSpacingChange = useCallback(
    (value: number[]) => {
      const spacing = value[0] === 0 ? '0' : `${value[0]}em`;
      setStyleProperty(mode, 'letter-spacing', spacing);
    },
    [mode, setStyleProperty]
  );

  // Parse current letter spacing value
  const parsedSpacing = parseFloat(currentStyles['letter-spacing'] || '0');
  const currentSpacing = isNaN(parsedSpacing) ? 0 : parsedSpacing;

  return (
    <div className="space-y-6">
      {/* Sans-serif Font */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Sans-serif Font
        </Label>
        <Select
          value={currentStyles['font-sans']}
          onValueChange={(value) => handleFontChange('font-sans', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {FONT_STACKS.sans.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Serif Font */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Serif Font
        </Label>
        <Select
          value={currentStyles['font-serif']}
          onValueChange={(value) => handleFontChange('font-serif', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {FONT_STACKS.serif.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Monospace Font */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Monospace Font
        </Label>
        <Select
          value={currentStyles['font-mono']}
          onValueChange={(value) => handleFontChange('font-mono', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {FONT_STACKS.mono.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Letter Spacing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Letter Spacing
          </Label>
          <span className="text-xs text-muted-foreground font-mono">
            {currentSpacing === 0 ? '0' : `${currentSpacing.toFixed(2)}em`}
          </span>
        </div>
        <Slider
          value={[currentSpacing]}
          onValueChange={handleLetterSpacingChange}
          min={-0.05}
          max={0.1}
          step={0.005}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Negative values tighten text, positive values loosen it.
        </p>
      </div>
    </div>
  );
}
