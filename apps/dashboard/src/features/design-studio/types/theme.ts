/**
 * Design Studio - Theme Types
 * Extracted and adapted from tweakcn (https://github.com/jnsahaj/tweakcn)
 *
 * This schema defines the structure for theme customizations,
 * supporting both light and dark modes with full shadcn/ui compatibility.
 */

import { z } from 'zod';

/**
 * Individual theme style properties for a single mode (light or dark)
 * Uses OKLCH color format for Tailwind CSS v4 compatibility
 */
export const themeStylePropsSchema = z.object({
  // Base colors
  background: z.string().describe('Page background color'),
  foreground: z.string().describe('Default text color'),

  // Card colors
  card: z.string().describe('Card background color'),
  'card-foreground': z.string().describe('Card text color'),

  // Popover colors
  popover: z.string().describe('Popover background color'),
  'popover-foreground': z.string().describe('Popover text color'),

  // Primary action colors
  primary: z.string().describe('Primary action color'),
  'primary-foreground': z.string().describe('Primary action text'),

  // Secondary action colors
  secondary: z.string().describe('Secondary action color'),
  'secondary-foreground': z.string().describe('Secondary action text'),

  // Muted colors
  muted: z.string().describe('Muted/disabled background'),
  'muted-foreground': z.string().describe('Muted text color'),

  // Accent colors
  accent: z.string().describe('Accent highlight color'),
  'accent-foreground': z.string().describe('Accent text color'),

  // Destructive/error colors
  destructive: z.string().describe('Error/danger color'),
  'destructive-foreground': z.string().describe('Error text color'),

  // UI element colors
  border: z.string().describe('Border color'),
  input: z.string().describe('Input border color'),
  ring: z.string().describe('Focus ring color'),

  // Sidebar colors (optional - for dashboard layouts)
  sidebar: z.string().optional().describe('Sidebar background'),
  'sidebar-foreground': z.string().optional().describe('Sidebar text'),
  'sidebar-primary': z.string().optional().describe('Sidebar primary action'),
  'sidebar-primary-foreground': z.string().optional().describe('Sidebar primary text'),
  'sidebar-accent': z.string().optional().describe('Sidebar accent'),
  'sidebar-accent-foreground': z.string().optional().describe('Sidebar accent text'),
  'sidebar-border': z.string().optional().describe('Sidebar border'),
  'sidebar-ring': z.string().optional().describe('Sidebar focus ring'),

  // Typography
  'font-sans': z.string().describe('Primary font family'),
  'font-serif': z.string().describe('Serif font family'),
  'font-mono': z.string().describe('Monospace font family'),
  'letter-spacing': z.string().describe('Default letter spacing'),

  // Shape
  radius: z.string().describe('Border radius'),
  spacing: z.string().optional().describe('Base spacing unit'),

  // Shadow properties
  'shadow-color': z.string().describe('Shadow base color'),
  'shadow-opacity': z.string().describe('Shadow opacity (0-1)'),
  'shadow-blur': z.string().describe('Shadow blur radius'),
  'shadow-spread': z.string().describe('Shadow spread'),
  'shadow-offset-x': z.string().describe('Shadow X offset'),
  'shadow-offset-y': z.string().describe('Shadow Y offset'),

  // Chart colors (for data visualizations)
  'chart-1': z.string().describe('Chart color 1'),
  'chart-2': z.string().describe('Chart color 2'),
  'chart-3': z.string().describe('Chart color 3'),
  'chart-4': z.string().describe('Chart color 4'),
  'chart-5': z.string().describe('Chart color 5'),
});

/**
 * Complete theme styles with light and dark mode variants
 */
export const themeStylesSchema = z.object({
  light: themeStylePropsSchema,
  dark: themeStylePropsSchema,
});

/**
 * HSL adjustment controls for global color shifts
 */
export const hslAdjustmentsSchema = z.object({
  /** Hue rotation in degrees (-180 to 180) */
  hueShift: z.number().min(-180).max(180).default(0),
  /** Saturation multiplier (0 = grayscale, 2 = double saturation) */
  saturationScale: z.number().min(0).max(2).default(1),
  /** Lightness multiplier (0.2 = darker, 2 = lighter) */
  lightnessScale: z.number().min(0.2).max(2).default(1),
});

/**
 * Theme editor state combining styles and adjustments
 */
export const themeEditorStateSchema = z.object({
  styles: themeStylesSchema,
  hslAdjustments: hslAdjustmentsSchema,
  currentMode: z.enum(['light', 'dark']),
  presetId: z.string().nullable(),
});

/**
 * Full theme customization record (database model)
 */
export const themeCustomizationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  styles: themeStylesSchema,
  hslAdjustments: hslAdjustmentsSchema,
  presetId: z.string().nullable(),
  version: z.number().int().positive(),
  isDraft: z.boolean(),
  publishedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid().optional(),
});

/**
 * Theme preset structure
 */
export const themePresetSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  category: z.enum(['minimal', 'vibrant', 'professional', 'nature', 'creative']).optional(),
  styles: themeStylesSchema,
  createdAt: z.string().optional(),
});

// Type exports
export type ThemeStyleProps = z.infer<typeof themeStylePropsSchema>;
export type ThemeStyles = z.infer<typeof themeStylesSchema>;
export type HSLAdjustments = z.infer<typeof hslAdjustmentsSchema>;
export type ThemeEditorState = z.infer<typeof themeEditorStateSchema>;
export type ThemeCustomization = z.infer<typeof themeCustomizationSchema>;
export type ThemePreset = z.infer<typeof themePresetSchema>;

/**
 * Color format types supported by the editor
 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch';

/**
 * Validation issue severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue structure
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Color pair for contrast checking
 */
export interface ColorPair {
  bg: keyof ThemeStyleProps;
  fg: keyof ThemeStyleProps;
  label: string;
  critical?: boolean;
}

/**
 * Contrast check result
 */
export interface ContrastResult extends ColorPair {
  ratio: string;
  numericRatio: number;
  passesAA: boolean;
  passesAAA: boolean;
  bgColor: string;
  fgColor: string;
}
