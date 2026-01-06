/**
 * Design Studio - Default Theme Configuration
 * Extracted and adapted from tweakcn (https://github.com/jnsahaj/tweakcn)
 *
 * Uses OKLCH color format for Tailwind CSS v4 compatibility.
 * OKLCH provides better perceptual uniformity than HSL.
 */

import type { ThemeStyles, ThemeStyleProps, HSLAdjustments, ThemeEditorState } from '../types/theme';

/**
 * Properties that are shared between light and dark modes
 * (not duplicated in dark mode definition)
 */
export const COMMON_STYLE_KEYS: (keyof ThemeStyleProps)[] = [
  'font-sans',
  'font-serif',
  'font-mono',
  'letter-spacing',
  'radius',
  'shadow-blur',
  'shadow-spread',
  'shadow-offset-x',
  'shadow-offset-y',
];

/**
 * Default light theme styles
 */
export const defaultLightThemeStyles: ThemeStyleProps = {
  // Base colors
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.145 0 0)',

  // Card
  card: 'oklch(1 0 0)',
  'card-foreground': 'oklch(0.145 0 0)',

  // Popover
  popover: 'oklch(1 0 0)',
  'popover-foreground': 'oklch(0.145 0 0)',

  // Primary
  primary: 'oklch(0.205 0 0)',
  'primary-foreground': 'oklch(0.985 0 0)',

  // Secondary
  secondary: 'oklch(0.97 0 0)',
  'secondary-foreground': 'oklch(0.205 0 0)',

  // Muted
  muted: 'oklch(0.97 0 0)',
  'muted-foreground': 'oklch(0.556 0 0)',

  // Accent
  accent: 'oklch(0.97 0 0)',
  'accent-foreground': 'oklch(0.205 0 0)',

  // Destructive
  destructive: 'oklch(0.577 0.245 27.325)',
  'destructive-foreground': 'oklch(0.577 0.245 27.325)',

  // UI elements
  border: 'oklch(0.922 0 0)',
  input: 'oklch(0.922 0 0)',
  ring: 'oklch(0.708 0 0)',

  // Sidebar (optional)
  sidebar: 'oklch(0.985 0 0)',
  'sidebar-foreground': 'oklch(0.145 0 0)',
  'sidebar-primary': 'oklch(0.205 0 0)',
  'sidebar-primary-foreground': 'oklch(0.985 0 0)',
  'sidebar-accent': 'oklch(0.97 0 0)',
  'sidebar-accent-foreground': 'oklch(0.205 0 0)',
  'sidebar-border': 'oklch(0.922 0 0)',
  'sidebar-ring': 'oklch(0.708 0 0)',

  // Typography
  'font-sans': 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  'font-serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  'font-mono': 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  'letter-spacing': '0',

  // Shape
  radius: '0.625rem',

  // Shadows
  'shadow-color': 'oklch(0 0 0)',
  'shadow-opacity': '0.1',
  'shadow-blur': '3px',
  'shadow-spread': '0px',
  'shadow-offset-x': '0px',
  'shadow-offset-y': '1px',

  // Charts
  'chart-1': 'oklch(0.646 0.222 41.116)',
  'chart-2': 'oklch(0.6 0.118 184.704)',
  'chart-3': 'oklch(0.398 0.07 227.392)',
  'chart-4': 'oklch(0.828 0.189 84.429)',
  'chart-5': 'oklch(0.769 0.188 70.08)',
};

/**
 * Default dark theme styles
 * Inherits common properties from light theme, overrides colors
 */
export const defaultDarkThemeStyles: ThemeStyleProps = {
  // Inherit common styles
  'font-sans': defaultLightThemeStyles['font-sans'],
  'font-serif': defaultLightThemeStyles['font-serif'],
  'font-mono': defaultLightThemeStyles['font-mono'],
  'letter-spacing': defaultLightThemeStyles['letter-spacing'],
  radius: defaultLightThemeStyles.radius,
  'shadow-blur': defaultLightThemeStyles['shadow-blur'],
  'shadow-spread': defaultLightThemeStyles['shadow-spread'],
  'shadow-offset-x': defaultLightThemeStyles['shadow-offset-x'],
  'shadow-offset-y': defaultLightThemeStyles['shadow-offset-y'],

  // Dark mode colors
  background: 'oklch(0.145 0 0)',
  foreground: 'oklch(0.985 0 0)',

  card: 'oklch(0.145 0 0)',
  'card-foreground': 'oklch(0.985 0 0)',

  popover: 'oklch(0.145 0 0)',
  'popover-foreground': 'oklch(0.985 0 0)',

  primary: 'oklch(0.985 0 0)',
  'primary-foreground': 'oklch(0.205 0 0)',

  secondary: 'oklch(0.269 0 0)',
  'secondary-foreground': 'oklch(0.985 0 0)',

  muted: 'oklch(0.269 0 0)',
  'muted-foreground': 'oklch(0.708 0 0)',

  accent: 'oklch(0.269 0 0)',
  'accent-foreground': 'oklch(0.985 0 0)',

  destructive: 'oklch(0.396 0.141 25.723)',
  'destructive-foreground': 'oklch(0.637 0.237 25.331)',

  border: 'oklch(0.269 0 0)',
  input: 'oklch(0.269 0 0)',
  ring: 'oklch(0.439 0 0)',

  // Sidebar
  sidebar: 'oklch(0.205 0 0)',
  'sidebar-foreground': 'oklch(0.985 0 0)',
  'sidebar-primary': 'oklch(0.488 0.243 264.376)',
  'sidebar-primary-foreground': 'oklch(0.985 0 0)',
  'sidebar-accent': 'oklch(0.269 0 0)',
  'sidebar-accent-foreground': 'oklch(0.985 0 0)',
  'sidebar-border': 'oklch(0.269 0 0)',
  'sidebar-ring': 'oklch(0.439 0 0)',

  // Shadows (darker base)
  'shadow-color': 'oklch(0 0 0)',
  'shadow-opacity': '0.25',

  // Charts
  'chart-1': 'oklch(0.488 0.243 264.376)',
  'chart-2': 'oklch(0.696 0.17 162.48)',
  'chart-3': 'oklch(0.769 0.188 70.08)',
  'chart-4': 'oklch(0.627 0.265 303.9)',
  'chart-5': 'oklch(0.645 0.246 16.439)',
};

/**
 * Complete default theme styles
 */
export const defaultThemeStyles: ThemeStyles = {
  light: defaultLightThemeStyles,
  dark: defaultDarkThemeStyles,
};

/**
 * Default HSL adjustments (no modifications)
 */
export const defaultHSLAdjustments: HSLAdjustments = {
  hueShift: 0,
  saturationScale: 1,
  lightnessScale: 1,
};

/**
 * Default theme editor state
 */
export const defaultThemeEditorState: ThemeEditorState = {
  styles: defaultThemeStyles,
  hslAdjustments: defaultHSLAdjustments,
  currentMode: 'light',
  presetId: null,
};

/**
 * HSL adjustment presets for quick modifications
 */
export const hslPresets = [
  { label: 'Original', hueShift: 0, saturationScale: 1, lightnessScale: 1 },
  { label: 'Darker', hueShift: 0, saturationScale: 1, lightnessScale: 0.8 },
  { label: 'Lighter', hueShift: 0, saturationScale: 1, lightnessScale: 1.2 },
  { label: 'Vibrant', hueShift: 0, saturationScale: 1.5, lightnessScale: 1 },
  { label: 'Muted', hueShift: 0, saturationScale: 0.5, lightnessScale: 1 },
  { label: 'Grayscale', hueShift: 0, saturationScale: 0, lightnessScale: 1 },
  { label: 'Warm', hueShift: 30, saturationScale: 1, lightnessScale: 1 },
  { label: 'Cool', hueShift: -30, saturationScale: 1, lightnessScale: 1 },
  { label: 'Complementary', hueShift: 180, saturationScale: 1, lightnessScale: 1 },
  { label: 'Triadic +', hueShift: 120, saturationScale: 1, lightnessScale: 1 },
  { label: 'Triadic -', hueShift: -120, saturationScale: 1, lightnessScale: 1 },
  { label: 'Analogous +', hueShift: 30, saturationScale: 1.2, lightnessScale: 1 },
  { label: 'Analogous -', hueShift: -30, saturationScale: 1.2, lightnessScale: 1 },
  { label: 'High Contrast', hueShift: 0, saturationScale: 1.5, lightnessScale: 0.9 },
  { label: 'Pastel', hueShift: 0, saturationScale: 0.6, lightnessScale: 1.3 },
];
