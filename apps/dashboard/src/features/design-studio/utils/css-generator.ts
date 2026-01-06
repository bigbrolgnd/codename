/**
 * Design Studio - CSS Generator
 * Extracted and adapted from tweakcn (https://github.com/jnsahaj/tweakcn)
 *
 * Generates CSS custom properties from theme styles.
 * Supports both Tailwind CSS v3 and v4 output formats.
 */

import type { ThemeStyles, ThemeStyleProps, ColorFormat, HSLAdjustments } from '../types/theme';
import { colorFormatter, adjustColorByHSL } from './color-converter';
import { COMMON_STYLE_KEYS } from '../config/default-theme';

/**
 * Options for CSS generation
 */
export interface CSSGeneratorOptions {
  /** Color format for output (default: oklch) */
  colorFormat?: ColorFormat;
  /** Tailwind version (default: 4) */
  tailwindVersion?: 3 | 4;
  /** Include Tailwind v4 @theme directive (default: true for v4) */
  includeTailwindTheme?: boolean;
  /** Minify output (default: false) */
  minify?: boolean;
  /** Global HSL adjustments to apply to all colors */
  adjustments?: HSLAdjustments;
}

const defaultOptions: CSSGeneratorOptions = {
  colorFormat: 'oklch',
  tailwindVersion: 4,
  includeTailwindTheme: true,
  minify: false,
};

/**
 * Color properties that need color format conversion
 */
const COLOR_PROPERTIES = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  'shadow-color',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
];

/**
 * Generate CSS custom properties from theme styles
 *
 * @param styles - Theme styles object
 * @param options - Generation options
 * @returns Complete CSS string
 */
export function generateThemeCSS(
  styles: ThemeStyles,
  options: CSSGeneratorOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  const nl = opts.minify ? '' : '\n';
  const indent = opts.minify ? '' : '  ';

  const lightCSS = generateModeCSS(styles.light, 'light', opts);
  const darkCSS = generateModeCSS(styles.dark, 'dark', opts);

  let css = `:root {${nl}${lightCSS}${nl}}${nl}${nl}.dark {${nl}${darkCSS}${nl}}`;

  // Add Tailwind v4 @theme directive
  if (opts.tailwindVersion === 4 && opts.includeTailwindTheme) {
    const themeDirective = generateTailwindV4Theme(styles.light, opts);
    css += `${nl}${nl}${themeDirective}`;
  }

  // Add letter-spacing body rule if set
  if (styles.light['letter-spacing'] && styles.light['letter-spacing'] !== '0') {
    css += `${nl}${nl}body {${nl}${indent}letter-spacing: var(--letter-spacing);${nl}}`;
  }

  return css;
}

/**
 * Generate CSS for a single mode (light or dark)
 */
function generateModeCSS(
  props: ThemeStyleProps,
  mode: 'light' | 'dark',
  options: CSSGeneratorOptions
): string {
  const indent = options.minify ? '' : '  ';
  const nl = options.minify ? '' : '\n';
  const lines: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;

    // Skip common properties in dark mode (they're inherited)
    if (mode === 'dark' && COMMON_STYLE_KEYS.includes(key as keyof ThemeStyleProps)) {
      continue;
    }

    // Format colors if this is a color property
    let formattedValue = value;
    if (COLOR_PROPERTIES.includes(key)) {
      // Apply HSL adjustments first
      if (options.adjustments) {
        formattedValue = adjustColorByHSL(
          value,
          options.adjustments.hueShift,
          options.adjustments.saturationScale,
          options.adjustments.lightnessScale
        );
      }
      
      if (options.colorFormat) {
        formattedValue = colorFormatter(formattedValue, options.colorFormat, options.tailwindVersion);
      }
    }

    lines.push(`${indent}--${key}: ${formattedValue};`);
  }

  return lines.join(nl);
}

/**
 * Generate Tailwind v4 @theme inline directive
 */
function generateTailwindV4Theme(
  props: ThemeStyleProps,
  options: CSSGeneratorOptions
): string {
  const indent = options.minify ? '' : '  ';
  const nl = options.minify ? '' : '\n';

  const mappings = [
    // Colors
    `${indent}--color-background: var(--background);`,
    `${indent}--color-foreground: var(--foreground);`,
    `${indent}--color-card: var(--card);`,
    `${indent}--color-card-foreground: var(--card-foreground);`,
    `${indent}--color-popover: var(--popover);`,
    `${indent}--color-popover-foreground: var(--popover-foreground);`,
    `${indent}--color-primary: var(--primary);`,
    `${indent}--color-primary-foreground: var(--primary-foreground);`,
    `${indent}--color-secondary: var(--secondary);`,
    `${indent}--color-secondary-foreground: var(--secondary-foreground);`,
    `${indent}--color-muted: var(--muted);`,
    `${indent}--color-muted-foreground: var(--muted-foreground);`,
    `${indent}--color-accent: var(--accent);`,
    `${indent}--color-accent-foreground: var(--accent-foreground);`,
    `${indent}--color-destructive: var(--destructive);`,
    `${indent}--color-destructive-foreground: var(--destructive-foreground);`,
    `${indent}--color-border: var(--border);`,
    `${indent}--color-input: var(--input);`,
    `${indent}--color-ring: var(--ring);`,
    // Radius
    `${indent}--radius-sm: calc(var(--radius) - 4px);`,
    `${indent}--radius-md: calc(var(--radius) - 2px);`,
    `${indent}--radius-lg: var(--radius);`,
    `${indent}--radius-xl: calc(var(--radius) + 4px);`,
  ];

  return `@theme inline {${nl}${mappings.join(nl)}${nl}}`;
}

/**
 * Generate CSS for just the color variables (useful for live preview)
 */
export function generateColorVariablesCSS(
  props: ThemeStyleProps,
  options: CSSGeneratorOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  const lines: string[] = [];

  for (const key of COLOR_PROPERTIES) {
    const value = props[key as keyof ThemeStyleProps];
    if (value) {
      let formattedValue = value;
      if (opts.adjustments) {
        formattedValue = adjustColorByHSL(
          value,
          opts.adjustments.hueShift,
          opts.adjustments.saturationScale,
          opts.adjustments.lightnessScale
        );
      }
      const formatted = colorFormatter(formattedValue, opts.colorFormat, opts.tailwindVersion);
      lines.push(`--${key}: ${formatted};`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate a complete CSS file with imports and base styles
 */
export function generateFullCSSFile(
  styles: ThemeStyles,
  options: CSSGeneratorOptions = {}
): string {
  const themeCSS = generateThemeCSS(styles, options);

  return `/*
 * Theme CSS - Generated by Design Studio
 * Do not edit manually - changes will be overwritten
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

${themeCSS}
`;
}

/**
 * Generate inline style object for preview
 * (For injecting into an iframe or component)
 */
export function generateStyleObject(
  props: ThemeStyleProps,
  options: CSSGeneratorOptions = {}
): Record<string, string> {
  const opts = { ...defaultOptions, ...options };
  const styleObj: Record<string, string> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;

    let formattedValue = value;
    if (COLOR_PROPERTIES.includes(key)) {
      if (opts.adjustments) {
        formattedValue = adjustColorByHSL(
          value,
          opts.adjustments.hueShift,
          opts.adjustments.saturationScale,
          opts.adjustments.lightnessScale
        );
      }
      
      if (opts.colorFormat) {
        formattedValue = colorFormatter(formattedValue, opts.colorFormat, opts.tailwindVersion);
      }
    }

    styleObj[`--${key}`] = formattedValue;
  }

  return styleObj;
}

/**
 * Parse CSS variables from a CSS string
 * (For importing existing themes)
 */
export function parseCSSVariables(css: string): Partial<ThemeStyleProps> {
  const props: Partial<ThemeStyleProps> = {};
  const regex = /--([a-z-]+):\s*([^;]+);/g;

  let match;
  while ((match = regex.exec(css)) !== null) {
    const key = match[1] as keyof ThemeStyleProps;
    const value = match[2].trim();
    props[key] = value;
  }

  return props;
}
