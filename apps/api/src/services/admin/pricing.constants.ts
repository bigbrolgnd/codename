/**
 * Pricing Constants
 *
 * Centralized pricing configuration for the platform.
 * Base plan prices and add-on pricing definitions.
 */

/**
 * Base plan types
 */
export const BASE_PLAN_TYPES = {
  FREE: 'free',
  STANDARD: 'standard',
  AI_POWERED: 'ai_powered',
} as const;

export type BasePlanType = typeof BASE_PLAN_TYPES[keyof typeof BASE_PLAN_TYPES];

/**
 * Base plan pricing (in cents USD)
 *
 * These are the monthly prices for each base plan tier.
 */
export const BASE_PLAN_PRICES = {
  [BASE_PLAN_TYPES.FREE]: 0, // $0.00
  [BASE_PLAN_TYPES.STANDARD]: 3900, // $39.00
  [BASE_PLAN_TYPES.AI_POWERED]: 7900, // $79.00
} as const;

/**
 * Free tier visit cap
 *
 * Maximum number of monthly visits for free tier users
 */
export const FREE_TIER_VISIT_CAP = 5000;

/**
 * Visit cap warning threshold
 *
 * Percentage of cap at which to send warning email (default: 80%)
 */
export const VISIT_CAP_WARNING_THRESHOLD = 0.8;

/**
 * Stripe price IDs for add-ons
 *
 * These must match the prices configured in the Stripe dashboard.
 * The format is: price_{addon_id}_monthly
 *
 * TODO: Configure actual Stripe price IDs before production
 */
export const STRIPE_PRICE_IDS = {
  // Base plans
  [BASE_PLAN_TYPES.STANDARD]: 'price_standard_monthly',
  [BASE_PLAN_TYPES.AI_POWERED]: 'price_ai_powered_monthly',

  // Add-ons
  'smart-calendar': 'price_smart_calendar_monthly',
  'booking-system': 'price_booking_system_monthly',
  'smart-calendar-ai': 'price_smart_calendar_ai_monthly',
  'multi-location': 'price_multi_location_monthly',
  'brand-removal': 'price_brand_removal_monthly',
  'priority-support': 'price_priority_support_monthly',
  'custom-domain': 'price_custom_domain_monthly',
  'api-access': 'price_api_access_monthly',
} as const;

/**
 * Pricing categories
 */
export const PRICING_CATEGORIES = {
  FREE: 'free',
  PREMIUM: 'premium',
  AI: 'ai',
  INFRASTRUCTURE: 'infrastructure',
} as const;

/**
 * Add-on pricing configuration
 *
 * Maps add-on IDs to their pricing details
 */
export const ADDON_PRICING = {
  'smart-calendar': {
    name: 'Smart Calendar',
    category: PRICING_CATEGORIES.PREMIUM,
    priceCents: 2900, // $29.00
    stripePriceId: STRIPE_PRICE_IDS['smart-calendar'],
  },
  'booking-system': {
    name: 'Booking System',
    category: PRICING_CATEGORIES.INFRASTRUCTURE,
    priceCents: 1900, // $19.00
    stripePriceId: STRIPE_PRICE_IDS['booking-system'],
  },
  'smart-calendar-ai': {
    name: 'Smart Calendar AI',
    category: PRICING_CATEGORIES.PREMIUM,
    priceCents: 4900, // $49.00
    stripePriceId: STRIPE_PRICE_IDS['smart-calendar-ai'],
  },
  'multi-location': {
    name: 'Multi-Location',
    category: PRICING_CATEGORIES.INFRASTRUCTURE,
    priceCents: 2900, // $29.00
    stripePriceId: STRIPE_PRICE_IDS['multi-location'],
  },
  'brand-removal': {
    name: 'Brand Removal',
    category: PRICING_CATEGORIES.PREMIUM,
    priceCents: 9900, // $99.00
    stripePriceId: STRIPE_PRICE_IDS['brand-removal'],
  },
  'priority-support': {
    name: 'Priority Support',
    category: PRICING_CATEGORIES.INFRASTRUCTURE,
    priceCents: 1900, // $19.00
    stripePriceId: STRIPE_PRICE_IDS['priority-support'],
  },
  'custom-domain': {
    name: 'Custom Domain',
    category: PRICING_CATEGORIES.INFRASTRUCTURE,
    priceCents: 990, // $9.90
    stripePriceId: STRIPE_PRICE_IDS['custom-domain'],
  },
  'api-access': {
    name: 'API Access',
    category: PRICING_CATEGORIES.INFRASTRUCTURE,
    priceCents: 4900, // $49.00
    stripePriceId: STRIPE_PRICE_IDS['api-access'],
  },
} as const;

/**
 * Helper function to get base plan price
 * @param planType - Base plan type
 * @returns Price in cents USD
 */
export function getBasePlanPrice(planType: BasePlanType): number {
  return BASE_PLAN_PRICES[planType] || 0;
}

/**
 * Helper function to get add-on price
 * @param addonId - Add-on identifier
 * @returns Price in cents USD or undefined if not found
 */
export function getAddonPrice(addonId: string): number | undefined {
  return ADDON_PRICING[addonId as keyof typeof ADDON_PRICING]?.priceCents;
}

/**
 * Helper function to get Stripe price ID
 * @param addonId - Add-on identifier
 * @returns Stripe price ID or undefined if not found
 */
export function getStripePriceId(addonId: string): string | undefined {
  return ADDON_PRICING[addonId as keyof typeof ADDON_PRICING]?.stripePriceId;
}
