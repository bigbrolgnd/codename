import { z } from 'zod';

export const PLAN_TIERS = {
  BASIC: 'basic',
  GROWTH: 'growth',
  PRO: 'pro',
} as const;

export type PlanTier = typeof PLAN_TIERS[keyof typeof PLAN_TIERS];

/**
 * Individual theme style properties for a single mode (light or dark)
 * Uses OKLCH color format for Tailwind CSS v4 compatibility
 */
export const ThemeStylePropsSchema = z.object({
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

  // Sidebar colors
  sidebar: z.string().optional(),
  'sidebar-foreground': z.string().optional(),
  'sidebar-primary': z.string().optional(),
  'sidebar-primary-foreground': z.string().optional(),
  'sidebar-accent': z.string().optional(),
  'sidebar-accent-foreground': z.string().optional(),
  'sidebar-border': z.string().optional(),
  'sidebar-ring': z.string().optional(),

  // Typography
  'font-sans': z.string().describe('Primary font family'),
  'font-serif': z.string().describe('Serif font family'),
  'font-mono': z.string().describe('Monospace font family'),
  'letter-spacing': z.string().describe('Default letter spacing'),

  // Shape
  radius: z.string().describe('Border radius'),
  spacing: z.string().optional(),

  // Shadow properties
  'shadow-color': z.string().describe('Shadow base color'),
  'shadow-opacity': z.string().describe('Shadow opacity'),
  'shadow-blur': z.string().describe('Shadow blur radius'),
  'shadow-spread': z.string().describe('Shadow spread'),
  'shadow-offset-x': z.string().describe('Shadow X offset'),
  'shadow-offset-y': z.string().describe('Shadow Y offset'),

  // Chart colors
  'chart-1': z.string().describe('Chart color 1'),
  'chart-2': z.string().describe('Chart color 2'),
  'chart-3': z.string().describe('Chart color 3'),
  'chart-4': z.string().describe('Chart color 4'),
  'chart-5': z.string().describe('Chart color 5'),
});

/**
 * Complete theme styles with light and dark mode variants
 */
export const ThemeStylesSchema = z.object({
  light: ThemeStylePropsSchema,
  dark: ThemeStylePropsSchema,
});

/**
 * HSL adjustment controls for global color shifts
 */
export const HSLAdjustmentsSchema = z.object({
  hueShift: z.number(),
  saturationScale: z.number(),
  lightnessScale: z.number(),
});

/**
 * Full theme customization record (database model compatible)
 */
export const ThemeCustomizationSchema = z.object({
  id: z.string().uuid().optional(),
  styles: ThemeStylesSchema,
  hslAdjustments: HSLAdjustmentsSchema,
  presetId: z.string().nullable(),
  version: z.number().int().positive().default(1),
  isDraft: z.boolean().default(true),
  publishedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const SaveThemeRequestSchema = z.object({
  theme: ThemeCustomizationSchema,
});

export const SaveThemeResponseSchema = z.object({
  success: z.boolean(),
  theme: ThemeCustomizationSchema,
});

export const GetThemeResponseSchema = z.object({
  theme: ThemeCustomizationSchema.nullable(),
});

export type ThemeStyleProps = z.infer<typeof ThemeStylePropsSchema>;
export type ThemeStyles = z.infer<typeof ThemeStylesSchema>;
export type HSLAdjustments = z.infer<typeof HSLAdjustmentsSchema>;
export type ThemeCustomization = z.infer<typeof ThemeCustomizationSchema>;
export type SaveThemeRequest = z.infer<typeof SaveThemeRequestSchema>;
export type SaveThemeResponse = z.infer<typeof SaveThemeResponseSchema>;
export type GetThemeResponse = z.infer<typeof GetThemeResponseSchema>;
