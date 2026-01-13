import { DatabaseManager } from '@codename/database';
import type { PricingConfig, TenantAddon } from '@codename/api';
import { BillingService } from './billing.service';
import { BASE_PLAN_PRICES, ADDON_PRICING, PRICING_CATEGORIES } from './pricing.constants';

/**
 * Tenant ID validation regex
 * Must match pattern: tenant_[a-z0-9_]+
 */
const TENANT_ID_REGEX = /^tenant_[a-z0-9_]+$/;

/**
 * PricingService
 *
 * Manages pricing configuration and tenant add-on subscriptions.
 * Handles pricing lookups from database and subscription lifecycle.
 */
export class PricingService {
  constructor(
    private db: DatabaseManager,
    private billingService?: BillingService
  ) {}

  /**
   * Get all active pricing configurations from database
   * @returns Array of all pricing entries ordered by category and name
   * @throws Error if database query fails
   */
  async getAllPricing(): Promise<PricingConfig[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM public.pricing_config WHERE is_active = TRUE ORDER BY category, name`
      );
      return result.rows;
    } catch (error) {
      console.error('[PricingService] Failed to fetch all pricing:', error);
      throw new Error(`Failed to fetch pricing configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pricing configurations by category
   * @param category - Category filter ('free', 'premium', 'ai', 'infrastructure')
   * @returns Array of pricing entries for the category
   * @throws Error if database query fails or invalid category
   */
  async getPricingByCategory(category: string): Promise<PricingConfig[]> {
    const validCategories = Object.values(PRICING_CATEGORIES);
    if (!validCategories.includes(category as any)) {
      throw new Error(`Invalid category: ${category}. Must be one of: ${validCategories.join(', ')}`);
    }

    try {
      const result = await this.db.query(
        `SELECT * FROM public.pricing_config WHERE category = $1 AND is_active = TRUE ORDER BY name`,
        [category]
      );
      return result.rows;
    } catch (error) {
      console.error(`[PricingService] Failed to fetch pricing for category ${category}:`, error);
      throw new Error(`Failed to fetch pricing for category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribe a tenant to an add-on
   * Creates or reactivates subscription via upsert
   * AC2: Creates Stripe subscription item AND tenant_addons record
   * @param tenantId - The tenant schema_name identifier
   * @param addonId - The pricing_config addon_id to subscribe to
   * @returns The created or updated tenant_addon record with stripeSubscriptionItemId
   * @throws Error if addon doesn't exist, tenantId invalid, or database operation fails
   */
  async subscribeToAddon(tenantId: string, addonId: string): Promise<TenantAddon & { stripeSubscriptionItemId?: string }> {
    // Validate tenantId format
    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new Error(`Invalid tenantId format: ${tenantId}. Must match pattern: tenant_[a-z0-9_]+`);
    }

    // Validate addon exists
    const addonCheck = await this.db.query(
      'SELECT addon_id FROM public.pricing_config WHERE addon_id = $1 AND is_active = TRUE',
      [addonId]
    );
    if (addonCheck.rows.length === 0) {
      throw new Error(`Add-on not found: ${addonId}`);
    }

    // AC2: Create Stripe subscription item if BillingService is available
    // Stripe creation MUST succeed for the subscription to be active
    let stripeSubscriptionItemId: string | undefined;
    if (this.billingService) {
      try {
        stripeSubscriptionItemId = await this.billingService.addSubscriptionItem(tenantId, addonId);
      } catch (error) {
        // If Stripe fails, we should NOT create the tenant_addons record
        // This prevents billing desync between database and Stripe
        console.error(`[PricingService] Failed to create Stripe subscription item for tenant ${tenantId}, addon ${addonId}:`, error);
        throw new Error(`Failed to create Stripe subscription item: ${error instanceof Error ? error.message : 'Unknown error'}. The subscription was not activated.`);
      }
    }

    // Use DatabaseManager's subscribeToAddon method
    const result = await this.db.subscribeToAddon(tenantId, addonId);
    const tenantAddon = result as TenantAddon;

    return {
      ...tenantAddon,
      stripeSubscriptionItemId,
    };
  }

  /**
   * Unsubscribe a tenant from an add-on
   * Soft delete by setting cancelled_at and is_active = false
   * @param tenantId - The tenant schema_name identifier
   * @param addonId - The addon_id to unsubscribe from
   * @throws Error if subscription doesn't exist or database operation fails
   */
  async unsubscribeFromAddon(tenantId: string, addonId: string): Promise<void> {
    // Validate tenantId format
    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new Error(`Invalid tenantId format: ${tenantId}. Must match pattern: tenant_[a-z0-9_]+`);
    }

    try {
      const result = await this.db.query(
        `UPDATE public.tenant_addons
         SET cancelled_at = NOW(), is_active = FALSE
         WHERE tenant_id = $1 AND addon_id = $2 AND is_active = TRUE
         RETURNING id`,
        [tenantId, addonId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Active subscription not found for tenant ${tenantId} and add-on ${addonId}`);
      }
    } catch (error) {
      console.error(`[PricingService] Failed to unsubscribe tenant ${tenantId} from addon ${addonId}:`, error);
      throw new Error(`Failed to unsubscribe from add-on: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all active add-ons for a tenant
   * @param tenantId - The tenant schema_name identifier
   * @returns Array of tenant's active add-ons with pricing details
   * @throws Error if database query fails
   */
  async getTenantAddons(tenantId: string): Promise<TenantAddon[]> {
    // Validate tenantId format
    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new Error(`Invalid tenantId format: ${tenantId}. Must match pattern: tenant_[a-z0-9_]+`);
    }

    try {
      const result = await this.db.getTenantAddons(tenantId);
      return result as TenantAddon[];
    } catch (error) {
      console.error(`[PricingService] Failed to fetch addons for tenant ${tenantId}:`, error);
      throw new Error(`Failed to fetch tenant add-ons: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate monthly total for a tenant
   * Sums base plan price + all active add-on prices
   *
   * Note: Naming convention follows TypeScript camelCase for application layer.
   * Database columns use snake_case (e.g., current_month_visits) per PostgreSQL convention.
   * Data transformation between layers is handled by Zod schemas at API boundaries.
   *
   * @param tenantId - The tenant schema_name identifier
   * @returns Monthly total in cents
   * @throws Error if database query fails
   */
  async calculateMonthlyTotal(tenantId: string): Promise<number> {
    // Validate tenantId format
    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new Error(`Invalid tenantId format: ${tenantId}. Must match pattern: tenant_[a-z0-9_]+`);
    }

    try {
      // Get tenant's base plan
      const tenantResult = await this.db.query(
        'SELECT base_plan_type FROM public.tenants WHERE schema_name = $1',
        [tenantId]
      );

      if (tenantResult.rows.length === 0) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      const basePlan = tenantResult.rows[0].base_plan_type;
      let total = 0;

      // Use centralized base plan pricing from BASE_PLAN_PRICES constant
      total += BASE_PLAN_PRICES[basePlan as keyof typeof BASE_PLAN_PRICES] || 0;

      // If AI-Powered plan, all add-ons are included (no additional cost)
      if (basePlan === 'ai_powered') {
        return total;
      }

      // For Free/Standard plans, add up active premium add-ons
      const addonsResult = await this.db.query(
        `SELECT pc.price_cents
         FROM public.tenant_addons ta
         JOIN public.pricing_config pc ON ta.addon_id = pc.addon_id
         WHERE ta.tenant_id = $1 AND ta.is_active = TRUE AND pc.category IN ('premium', 'infrastructure')`,
        [tenantId]
      );

      for (const row of addonsResult.rows) {
        total += row.price_cents || 0;
      }

      return total;
    } catch (error) {
      console.error(`[PricingService] Failed to calculate monthly total for tenant ${tenantId}:`, error);
      throw new Error(`Failed to calculate monthly total: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
