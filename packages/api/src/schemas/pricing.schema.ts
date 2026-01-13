import { z } from 'zod';

/**
 * Base plan types for the new pricing model
 * Replaces the old PLAN_TIERS (basic/growth/pro)
 */
export const BASE_PLAN_TYPES = {
  FREE: 'free',
  STANDARD: 'standard',
  AI_POWERED: 'ai_powered',
} as const;

export type BasePlanType = typeof BASE_PLAN_TYPES[keyof typeof BASE_PLAN_TYPES];

/**
 * Billing intervals for paid add-ons
 */
export const BILLING_INTERVALS = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
  ONE_TIME: 'one-time',
} as const;

export type BillingInterval = typeof BILLING_INTERVALS[keyof typeof BILLING_INTERVALS];

/**
 * Add-on categories
 */
export const ADDON_CATEGORIES = {
  FREE: 'free', // Social media integrations (free APIs)
  PREMIUM: 'premium', // Workflow add-ons
  AI: 'ai', // AI-powered features (token-based)
  INFRASTRUCTURE: 'infrastructure', // Domains, hosting, support
} as const;

export type AddonCategory = typeof ADDON_CATEGORIES[keyof typeof ADDON_CATEGORIES];

/**
 * Pricing configuration schema
 */
export const PricingConfigSchema = z.object({
  id: z.string().uuid(),
  addon_id: z.string().describe('Unique slug identifier'),
  name: z.string(),
  category: z.enum(['free', 'premium', 'ai', 'infrastructure']),
  price_cents: z.number().int().nonnegative().default(0),
  billing_interval: z.enum(['monthly', 'quarterly', 'annual', 'one-time']).nullable(),
  token_multiplier: z.number().int().positive().default(5),
  requires_base_plan: z.boolean().default(true),
  requires_ai_plan: z.boolean().default(false),
  description: z.string().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Tenant add-on subscription schema
 */
export const TenantAddonSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string(),
  addon_id: z.string(),
  stripe_subscription_item_id: z.string().nullable(),
  subscribed_at: z.string().datetime(),
  cancelled_at: z.string().datetime().nullable(),
  is_active: z.boolean().default(true),
});

/**
 * Tenant base plan schema
 */
export const TenantPlanSchema = z.object({
  schema_name: z.string(),
  base_plan_type: z.enum(['free', 'standard', 'ai_powered']),
  billing_interval: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  stripe_customer_id: z.string().nullable(),
  stripe_subscription_id: z.string().nullable(),
  monthly_visit_cap: z.number().int().default(5000),
  current_month_visits: z.number().int().default(0),
  visit_cap_warning_sent: z.boolean().default(false),
  last_visit_count_reset: z.string().date(),
});

/**
 * Request schemas
 */
export const SubscribeToAddonRequestSchema = z.object({
  tenant_id: z.string(),
  addon_id: z.string(),
  stripe_subscription_item_id: z.string().optional(),
});

export const UpdateBasePlanRequestSchema = z.object({
  tenant_id: z.string(),
  plan_type: z.enum(['free', 'standard', 'ai_powered']),
});

export const GetPricingConfigResponseSchema = z.object({
  success: z.boolean(),
  pricing: z.array(PricingConfigSchema),
});

export const GetTenantAddonsResponseSchema = z.object({
  success: z.boolean(),
  addons: z.array(TenantAddonSchema),
});

export const SubscribeToAddonResponseSchema = z.object({
  success: z.boolean(),
  subscription: TenantAddonSchema,
});

export const UpdateBasePlanResponseSchema = z.object({
  success: z.boolean(),
  tenant: TenantPlanSchema,
});

// Type exports
export type PricingConfig = z.infer<typeof PricingConfigSchema>;
export type TenantAddon = z.infer<typeof TenantAddonSchema>;
export type TenantPlan = z.infer<typeof TenantPlanSchema>;
export type SubscribeToAddonRequest = z.infer<typeof SubscribeToAddonRequestSchema>;
export type UpdateBasePlanRequest = z.infer<typeof UpdateBasePlanRequestSchema>;
export type GetPricingConfigResponse = z.infer<typeof GetPricingConfigResponseSchema>;
export type GetTenantAddonsResponse = z.infer<typeof GetTenantAddonsResponseSchema>;
export type SubscribeToAddonResponse = z.infer<typeof SubscribeToAddonResponseSchema>;
export type UpdateBasePlanResponse = z.infer<typeof UpdateBasePlanResponseSchema>;
