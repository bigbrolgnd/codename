/**
 * Design Studio - Contrast Checker Utilities
 * Extracted and adapted from tweakcn (https://github.com/jnsahaj/tweakcn)
 *
 * Implements WCAG 2.1 contrast ratio calculations for accessibility validation.
 * Uses the culori library for accurate luminance calculations.
 */

import { parse, wcagLuminance } from 'culori';
import type { ThemeStyleProps, ColorPair, ContrastResult, ValidationIssue, HSLAdjustments } from '../types/theme';
import { adjustColorByHSL } from './color-converter';

/**
 * WCAG 2.1 contrast ratio thresholds
 */
export const WCAG_AA_THRESHOLD = 4.5; // Normal text
export const WCAG_AA_LARGE_THRESHOLD = 3.0; // Large text (18pt+ or 14pt+ bold)
export const WCAG_AAA_THRESHOLD = 7.0; // Enhanced contrast

/**
 * Color pairs to check for accessibility
 * Critical pairs block publishing if they fail
 */
export const COLOR_PAIRS: ColorPair[] = [
  // Content & Containers
  { bg: 'background', fg: 'foreground', label: 'Background / Text', critical: true },
  { bg: 'card', fg: 'card-foreground', label: 'Card / Card Text', critical: true },
  { bg: 'popover', fg: 'popover-foreground', label: 'Popover / Popover Text' },
  { bg: 'muted', fg: 'muted-foreground', label: 'Muted / Muted Text' },

  // Interactive Elements
  { bg: 'primary', fg: 'primary-foreground', label: 'Primary / Primary Text', critical: true },
  { bg: 'secondary', fg: 'secondary-foreground', label: 'Secondary / Secondary Text' },
  { bg: 'accent', fg: 'accent-foreground', label: 'Accent / Accent Text' },

  // Functional
  { bg: 'destructive', fg: 'destructive-foreground', label: 'Destructive / Destructive Text', critical: true },
];

/**
 * Calculate the contrast ratio between two colors
 *
 * Uses the WCAG contrast ratio formula:
 * (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter luminance and L2 is the darker
 *
 * @param color1 - First color (any supported format)
 * @param color2 - Second color (any supported format)
 * @returns Contrast ratio as a string (e.g., "4.52")
 */
export function calculateContrastRatio(color1: string, color2: string): string {
  try {
    const parsed1 = parse(color1);
    const parsed2 = parse(color2);

    if (!parsed1 || !parsed2) {
      console.warn(`Failed to parse colors for contrast: "${color1}", "${color2}"`);
      return '1.00';
    }

    const lum1 = wcagLuminance(parsed1) ?? 0;
    const lum2 = wcagLuminance(parsed2) ?? 0;

    // WCAG formula
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    return ratio.toFixed(2);
  } catch (error) {
    console.error(`Contrast calculation error:`, error);
    return '1.00';
  }
}

/**
 * Check if a contrast ratio meets WCAG AA requirements
 */
export function meetsWCAG_AA(ratio: number | string): boolean {
  const numRatio = typeof ratio === 'string' ? parseFloat(ratio) : ratio;
  return numRatio >= WCAG_AA_THRESHOLD;
}

/**
 * Check if a contrast ratio meets WCAG AAA requirements
 */
export function meetsWCAG_AAA(ratio: number | string): boolean {
  const numRatio = typeof ratio === 'string' ? parseFloat(ratio) : ratio;
  return numRatio >= WCAG_AAA_THRESHOLD;
}

/**
 * Check all color pairs in a theme for contrast issues
 *
 * @param styles - Theme style properties to check
 * @param adjustments - Optional global HSL adjustments to apply before checking
 * @returns Array of contrast results for each color pair
 */
export function checkAllContrasts(
  styles: ThemeStyleProps,
  adjustments?: HSLAdjustments
): ContrastResult[] {
  return COLOR_PAIRS.map((pair) => {
    let bgColor = styles[pair.bg];
    let fgColor = styles[pair.fg];

    if (!bgColor || !fgColor) {
      return {
        ...pair,
        ratio: 'N/A',
        numericRatio: 0,
        passesAA: false,
        passesAAA: false,
        bgColor: bgColor || '',
        fgColor: fgColor || '',
      };
    }

    // Apply adjustments if provided
    if (adjustments && (adjustments.hueShift !== 0 || adjustments.saturationScale !== 1 || adjustments.lightnessScale !== 1)) {
      bgColor = adjustColorByHSL(
        bgColor,
        adjustments.hueShift,
        adjustments.saturationScale,
        adjustments.lightnessScale
      );
      fgColor = adjustColorByHSL(
        fgColor,
        adjustments.hueShift,
        adjustments.saturationScale,
        adjustments.lightnessScale
      );
    }

    const ratio = calculateContrastRatio(bgColor, fgColor);
    const numericRatio = parseFloat(ratio);

    return {
      ...pair,
      ratio,
      numericRatio,
      passesAA: numericRatio >= WCAG_AA_THRESHOLD,
      passesAAA: numericRatio >= WCAG_AAA_THRESHOLD,
      bgColor,
      fgColor,
    };
  });
}

/**
 * Get contrast validation issues for a theme
 *
 * @param styles - Theme style properties to validate
 * @returns Array of validation issues
 */
export function getContrastIssues(styles: ThemeStyleProps): ValidationIssue[] {
  const results = checkAllContrasts(styles);
  const issues: ValidationIssue[] = [];

  for (const result of results) {
    if (!result.passesAA) {
      issues.push({
        severity: result.critical ? 'error' : 'warning',
        field: `${result.bg}/${result.fg}`,
        message: `${result.label}: Contrast ratio ${result.ratio}:1 is below WCAG AA (${WCAG_AA_THRESHOLD}:1)`,
        suggestion: suggestContrastFix(result),
      });
    }
  }

  return issues;
}

/**
 * Suggest a fix for a contrast issue
 */
function suggestContrastFix(result: ContrastResult): string {
  if (result.numericRatio < 2) {
    return 'The colors are too similar. Try using a much darker or lighter foreground color.';
  }
  if (result.numericRatio < 3) {
    return 'Increase the lightness difference between background and foreground.';
  }
  if (result.numericRatio < 4.5) {
    return 'Slightly increase the contrast by adjusting the foreground color lightness.';
  }
  return '';
}

/**
 * Check if a theme can be published based on contrast validation
 * Returns false if any critical contrast check fails
 */
export function canPublishTheme(styles: ThemeStyleProps): boolean {
  const results = checkAllContrasts(styles);
  return !results.some((r) => r.critical && !r.passesAA);
}

/**
 * Get a summary of contrast check results
 */
export function getContrastSummary(styles: ThemeStyleProps): {
  total: number;
  passing: number;
  failing: number;
  criticalFailing: number;
} {
  const results = checkAllContrasts(styles);

  return {
    total: results.length,
    passing: results.filter((r) => r.passesAA).length,
    failing: results.filter((r) => !r.passesAA).length,
    criticalFailing: results.filter((r) => r.critical && !r.passesAA).length,
  };
}

/**
 * Calculate the relative luminance of a color
 * (Exposed for use in other utilities)
 */
export function getRelativeLuminance(color: string): number {
  try {
    const parsed = parse(color);
    if (!parsed) return 0;
    return wcagLuminance(parsed) ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Determine if a color is "light" or "dark"
 * Useful for determining foreground color automatically
 */
export function isLightColor(color: string): boolean {
  const luminance = getRelativeLuminance(color);
  return luminance > 0.179; // Standard threshold
}

/**
 * Suggest a foreground color based on background
 */
export function suggestForeground(backgroundColor: string): 'light' | 'dark' {
  return isLightColor(backgroundColor) ? 'dark' : 'light';
}
