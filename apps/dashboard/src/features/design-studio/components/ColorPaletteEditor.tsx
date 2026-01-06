/**
 * Color Palette Editor Component
 * Provides grouped color editing for all theme color properties.
 */

import { useCallback, useMemo } from 'react';
import { useThemeEditor } from '../hooks/useThemeEditor';
import { ColorPicker } from './ColorPicker';
import type { ThemeStyleProps } from '../types/theme';

interface ColorPaletteEditorProps {
  mode: 'light' | 'dark';
}

/**
 * Color groups for organized editing
 */
const COLOR_GROUPS_DEF = [
  {
    label: 'Base',
    colors: ['background', 'foreground'] as const,
  },
  {
    label: 'Cards & Popovers',
    colors: ['card', 'card-foreground', 'popover', 'popover-foreground'] as const,
  },
  {
    label: 'Primary & Secondary',
    colors: ['primary', 'primary-foreground', 'secondary', 'secondary-foreground'] as const,
  },
  {
    label: 'Muted & Accent',
    colors: ['muted', 'muted-foreground', 'accent', 'accent-foreground'] as const,
  },
  {
    label: 'Destructive',
    colors: ['destructive', 'destructive-foreground'] as const,
  },
  {
    label: 'UI Elements',
    colors: ['border', 'input', 'ring'] as const,
  },
  {
    label: 'Charts',
    colors: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const,
  },
];

export function ColorPaletteEditor({ mode }: ColorPaletteEditorProps) {
  const { themeState, setStyleProperty } = useThemeEditor();
  const currentStyles = themeState.styles[mode];

  const colorGroups = useMemo(() => COLOR_GROUPS_DEF, []);

  const handleColorChange = useCallback(
    (key: keyof ThemeStyleProps, value: string) => {
      setStyleProperty(mode, key, value);
    },
    [mode, setStyleProperty]
  );

  return (
    <div className="space-y-6">
      {colorGroups.map((group) => (
        <div key={group.label} className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {group.label}
          </h4>
          <div className="space-y-2">
            {group.colors.map((colorKey) => (
              <ColorPicker
                key={colorKey}
                label={formatLabel(colorKey)}
                value={currentStyles[colorKey] || ''}
                onChange={(value) => handleColorChange(colorKey, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Format color key to readable label
 */
function formatLabel(key: string): string {
  return key
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
