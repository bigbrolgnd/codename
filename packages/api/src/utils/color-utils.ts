import { parse, converter } from 'culori';

const toOklch = converter('oklch');
const toHsl = converter('hsl');

function formatNumber(num: number): string {
  if (Number.isInteger(num)) {
    return num.toString();
  }
  return parseFloat(num.toFixed(4)).toString();
}

/**
 * Apply HSL adjustments to a color
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
    l = Math.max(0.1, Math.min(1, l));

    // Convert back to OKLCH for output
    const adjustedHsl = { mode: 'hsl' as const, h, s, l };
    const oklch = toOklch(adjustedHsl);

    if (!oklch) return color;

    return `oklch(${formatNumber(oklch.l ?? 0)} ${formatNumber(oklch.c ?? 0)} ${formatNumber(oklch.h ?? 0)})`;
  } catch (error) {
    return color;
  }
}
