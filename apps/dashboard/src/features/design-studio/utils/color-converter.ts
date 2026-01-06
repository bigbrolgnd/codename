/**
 * Design Studio - Color Converter Utilities
 * Extracted and adapted from tweakcn (https://github.com/jnsahaj/tweakcn)
 *
 * Provides color format conversion between HSL, RGB, HEX, and OKLCH.
 * Uses the culori library for accurate color manipulation.
 */

import { parse, formatHex, formatRgb, formatHsl, converter } from 'culori';
import type { ColorFormat } from '../types/theme';

// OKLCH converter from culori
const toOklch = converter('oklch');
const toHsl = converter('hsl');
const toRgb = converter('rgb');

/**
 * Format a number for CSS output
 * - Integers remain as integers
 * - Decimals are limited to 4 decimal places
 */
function formatNumber(num: number): string {
  if (Number.isInteger(num)) {
    return num.toString();
  }
  return parseFloat(num.toFixed(4)).toString();
}

/**
 * Convert a color string to the specified format
 *
 * @param color - Input color in any supported format
 * @param format - Target format (hex, rgb, hsl, oklch)
 * @param tailwindVersion - Tailwind CSS version (3 or 4)
 * @returns Formatted color string
 */
export function colorFormatter(
  color: string,
  format: ColorFormat = 'oklch',
  tailwindVersion: 3 | 4 = 4
): string {
  try {
    const parsed = parse(color);
    if (!parsed) {
      console.warn(`Failed to parse color: ${color}`);
      return color;
    }

    switch (format) {
      case 'hex':
        return formatHex(parsed) ?? color;

      case 'rgb': {
        const rgb = toRgb(parsed);
        if (!rgb) return color;
        const r = Math.round((rgb.r ?? 0) * 255);
        const g = Math.round((rgb.g ?? 0) * 255);
        const b = Math.round((rgb.b ?? 0) * 255);
        return `rgb(${r} ${g} ${b})`;
      }

      case 'hsl': {
        const hsl = toHsl(parsed);
        if (!hsl) return color;
        const h = formatNumber(hsl.h ?? 0);
        const s = formatNumber((hsl.s ?? 0) * 100);
        const l = formatNumber((hsl.l ?? 0) * 100);

        // Tailwind v4 uses hsl() function wrapper
        // Tailwind v3 uses space-separated values
        if (tailwindVersion === 4) {
          return `hsl(${h} ${s}% ${l}%)`;
        }
        return `${h} ${s}% ${l}%`;
      }

      case 'oklch': {
        const oklch = toOklch(parsed);
        if (!oklch) return color;
        const l = formatNumber(oklch.l ?? 0);
        const c = formatNumber(oklch.c ?? 0);
        const h = formatNumber(oklch.h ?? 0);
        return `oklch(${l} ${c} ${h})`;
      }

      default:
        return color;
    }
  } catch (error) {
    console.error(`Color conversion error for "${color}":`, error);
    return color;
  }
}

/**
 * Convert color to HSL format
 */
export function convertToHSL(color: string, tailwindVersion: 3 | 4 = 4): string {
  return colorFormatter(color, 'hsl', tailwindVersion);
}

/**
 * Convert color to HEX format
 */
export function convertToHex(color: string): string {
  return colorFormatter(color, 'hex');
}

/**
 * Convert color to OKLCH format
 */
export function convertToOklch(color: string): string {
  return colorFormatter(color, 'oklch');
}

/**
 * Check if a color string is valid
 */
export function isValidColor(color: string): boolean {
  try {
    const parsed = parse(color);
    return parsed !== undefined;
  } catch {
    return false;
  }
}

/**
 * Get luminance of a color (0-1)
 * Used for contrast calculations
 */
export function getLuminance(color: string): number {
  try {
    const parsed = parse(color);
    if (!parsed) return 0;

    const rgb = toRgb(parsed);
    if (!rgb) return 0;

    // sRGB to linear RGB
    const toLinear = (c: number) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const r = toLinear(rgb.r ?? 0);
    const g = toLinear(rgb.g ?? 0);
    const b = toLinear(rgb.b ?? 0);

    // Relative luminance formula
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch {
    return 0;
  }
}

/**
 * Apply HSL adjustments to a color
 *
 * @param color - Input color
 * @param hueShift - Hue rotation in degrees (-180 to 180)
 * @param saturationScale - Saturation multiplier (0 to 2)
 * @param lightnessScale - Lightness multiplier (0.2 to 2)
 * @returns Adjusted color in OKLCH format
 */
export function adjustColorByHSL(
  color: string,
  hueShift: number = 0,
  saturationScale: number = 1,
  lightnessScale: number = 1
): string {
  try {
    const parsed = parse(color);
    if (!parsed) return color;

    const hsl = toHsl(parsed);
    if (!hsl) return color;

    // Apply adjustments
    let h = ((hsl.h ?? 0) + hueShift) % 360;
    if (h < 0) h += 360;

    let s = (hsl.s ?? 0) * saturationScale;
    s = Math.max(0, Math.min(1, s));

    let l = (hsl.l ?? 0) * lightnessScale;
    l = Math.max(0.1, Math.min(1, l)); // Keep minimum lightness at 0.1

    // Convert back to OKLCH for output
    const adjustedHsl = { mode: 'hsl' as const, h, s, l };
    const oklch = toOklch(adjustedHsl);

    if (!oklch) return color;

    return `oklch(${formatNumber(oklch.l ?? 0)} ${formatNumber(oklch.c ?? 0)} ${formatNumber(oklch.h ?? 0)})`;
  } catch (error) {
    console.error(`HSL adjustment error for "${color}":`, error);
    return color;
  }
}

/**
 * Parse a Tailwind color class to a color value
 * Handles both v3 and v4 syntax
 */
export function parseTailwindColor(className: string): string | null {
  // This is a simplified version - in production you'd want to
  // look up the actual Tailwind color palette values
  const tailwindColors: Record<string, string> = {
    'slate-50': '#f8fafc',
    'slate-100': '#f1f5f9',
    'slate-200': '#e2e8f0',
    'slate-500': '#64748b',
    'slate-900': '#0f172a',
    // Add more as needed
  };

  const match = className.match(/^([\w-]+)$/);
  if (match && tailwindColors[match[1]]) {
    return tailwindColors[match[1]];
  }

  return null;
}

/**
 * Detect the format of a color string
 */
export function detectColorFormat(color: string): ColorFormat | 'unknown' {
  const trimmed = color.trim().toLowerCase();

  if (trimmed.startsWith('#')) return 'hex';
  if (trimmed.startsWith('rgb')) return 'rgb';
  if (trimmed.startsWith('hsl')) return 'hsl';
  if (trimmed.startsWith('oklch')) return 'oklch';

  return 'unknown';
}
