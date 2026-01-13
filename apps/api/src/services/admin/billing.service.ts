import { DatabaseManager } from '@codename/database';
import { BILLING_CONFIG } from './billing.constants';
import { usageCache } from './usage.cache';
import { BASE_PLAN_TYPES } from '@codename/api';
import { STRIPE_PRICE_IDS, ADDON_PRICING } from './pricing.constants';
import Stripe from 'stripe';

export { usageCache };

/**
 * BillingService
 *
 * Handles subscription billing, usage tracking, and Stripe integration.
 * Replaced old plan_tier logic with new base_plan_type (free/standard/ai_powered).
 */
export class BillingService {
  private stripe: Stripe | null;

  constructor(private db: DatabaseManager) {
    // Initialize Stripe client with API key from environment
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.warn('[BillingService] STRIPE_SECRET_KEY not set - Stripe features disabled');
      this.stripe = null;
      return;
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-12-15.clover' as any,
    });
  }

  private getCacheKey(tenantId: string, monthStr: string): string {
    return `usage:${tenantId}:${monthStr}`;
  }

  /**
   * Checks if a tenant has reached their AI cost cap (Cache-First)
   */
  async checkAiCap(tenantId: string): Promise<boolean> {
    const monthYear = new Date();
    monthYear.setDate(1); // First of the month
    const monthStr = monthYear.toISOString().split('T')[0];
    const cacheKey = this.getCacheKey(tenantId, monthStr);

    // 1. Try cache first
    let tokensUsed = await usageCache.get(cacheKey);

    // 2. Fallback to DB if cache miss
    if (tokensUsed === null) {
      const result = await this.db.queryInSchema('public',
        `SELECT ai_tokens_used FROM tenant_usage
         WHERE tenant_id = $1 AND month_year = $2`,
        [tenantId, monthStr]
      );
      tokensUsed = result.rows[0]?.ai_tokens_used || 0;
      // Seed cache
      await usageCache.set(cacheKey, tokensUsed as number, BILLING_CONFIG.CACHE_TTL_SECONDS);
    }

    return (tokensUsed as number) >= BILLING_CONFIG.AI_COST_CAP_CENTS;
  }

  /**
   * Records AI usage for a tenant
   */
  async recordAiUsage(tenantId: string, tokens: number = 1) {
    const monthYear = new Date();
    monthYear.setDate(1);
    const monthStr = monthYear.toISOString().split('T')[0];
    const cacheKey = this.getCacheKey(tenantId, monthStr);

    // 1. Update DB
    await this.db.queryInSchema('public',
      `INSERT INTO tenant_usage (tenant_id, month_year, ai_tokens_used)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, month_year) DO UPDATE SET
        ai_tokens_used = tenant_usage.ai_tokens_used + EXCLUDED.ai_tokens_used,
        updated_at = NOW()`,
      [tenantId, monthStr, tokens]
    );

    // 2. Update/Inval cache
    await usageCache.incr(cacheKey, tokens);
  }

  /**
   * Returns current month usage status
   */
  async getUsageStatus(tenantId: string) {
    const monthYear = new Date();
    monthYear.setDate(1);
    const monthStr = monthYear.toISOString().split('T')[0];

    const result = await this.db.queryInSchema('public',
      `SELECT ai_tokens_used, visits_total FROM tenant_usage
       WHERE tenant_id = $1 AND month_year = $2`,
      [tenantId, monthStr]
    );

    const usage = result.rows[0] || { ai_tokens_used: 0, visits_total: 0 };

    return {
      aiPercentage: Math.min(100, Math.round((usage.ai_tokens_used / BILLING_CONFIG.AI_COST_CAP_CENTS) * 100)),
      visitsTotal: usage.visits_total,
      isCapped: usage.ai_tokens_used >= BILLING_CONFIG.AI_COST_CAP_CENTS
    };
  }

  /**
   * Returns the subscription status for a tenant
   * Updated to use new base_plan_type instead of deprecated plan_tier
   */
  async getSubscriptionStatus(tenantId: string) {
    const result = await this.db.queryInSchema('public',
      `SELECT base_plan_type, stripe_subscription_id, stripe_customer_id FROM tenants WHERE schema_name = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return {
        basePlanType: BASE_PLAN_TYPES.FREE,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        canAccessDesignStudio: false,
        hasPremiumAddons: false,
      };
    }

    const row = result.rows[0];

    // Query tenant_addons table to check for premium add-ons
    const addonsResult = await this.db.queryInSchema('public',
      `SELECT COUNT(*) as premium_count
       FROM tenant_addons
       WHERE tenant_id = $1 AND is_active = TRUE`,
      [tenantId]
    );
    const hasPremiumAddons = parseInt(addonsResult.rows[0].premium_count || '0', 10) > 0;

    return {
      basePlanType: row.base_plan_type || BASE_PLAN_TYPES.FREE,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      canAccessDesignStudio: row.base_plan_type === BASE_PLAN_TYPES.AI_POWERED,
      hasPremiumAddons,
    };
  }

  /**
   * Create a Stripe customer for a tenant
   * @param tenantId - The tenant schema_name identifier
   * @param email - Customer email address
   * @param name - Customer name (optional)
   * @returns Stripe customer object
   */
  async createStripeCustomer(tenantId: string, email: string, name?: string) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          tenant_id: tenantId,
        },
      });

      // Store customer ID in database
      await this.db.queryInSchema('public',
        'UPDATE tenants SET stripe_customer_id = $1 WHERE schema_name = $2',
        [customer.id, tenantId]
      );

      return customer;
    } catch (error) {
      console.error(`[BillingService] Failed to create Stripe customer for tenant ${tenantId}:`, error);
      throw new Error(`Failed to create Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a Stripe subscription with base plan and add-ons
   * @param tenantId - The tenant schema_name identifier
   * @param basePlanType - Base plan type ('free', 'standard', 'ai_powered')
   * @param addonIds - Array of addon IDs to include in subscription
   * @returns Stripe subscription object
   */
  async createSubscription(tenantId: string, basePlanType: string, addonIds: string[] = []) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    // Get tenant's Stripe customer ID
    const tenantResult = await this.db.queryInSchema('public',
      'SELECT stripe_customer_id FROM tenants WHERE schema_name = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0 || !tenantResult.rows[0].stripe_customer_id) {
      throw new Error(`Tenant ${tenantId} does not have a Stripe customer ID`);
    }

    const customerId = tenantResult.rows[0].stripe_customer_id;

    try {
      // Build subscription items array
      // Note: Price IDs must be configured in Stripe dashboard beforehand
      const items = await this.buildSubscriptionItems(basePlanType, addonIds);

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: items.map(item => ({ price: item })),
        metadata: {
          tenant_id: tenantId,
        },
      });

      // Store subscription ID in database
      await this.db.queryInSchema('public',
        'UPDATE tenants SET stripe_subscription_id = $1, base_plan_type = $2 WHERE schema_name = $3',
        [subscription.id, basePlanType, tenantId]
      );

      return subscription;
    } catch (error) {
      console.error(`[BillingService] Failed to create subscription for tenant ${tenantId}:`, error);
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle Stripe webhook events
   * @param event - Stripe webhook event object
   * @returns Success status
   */
  async handleWebhook(event: Stripe.Event): Promise<{ success: boolean }> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.syncSubscriptionFromStripe(subscription);
          break;
        }
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.handleInvoicePaid(invoice);
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.handleInvoicePaymentFailed(invoice);
          break;
        }
        default:
          console.log(`[BillingService] Unhandled webhook event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`[BillingService] Failed to handle webhook ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Sync subscription data from Stripe to database
   * @param subscription - Stripe subscription object
   */
  private async syncSubscriptionFromStripe(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata?.tenant_id;
    if (!tenantId) {
      console.warn('[BillingService] Subscription missing tenant_id metadata');
      return;
    }

    // Determine base plan type from subscription items
    // This requires mapping Stripe price IDs to plan types
    // For now, use the subscription metadata
    const basePlanType = subscription.metadata?.base_plan_type || 'standard';

    await this.db.queryInSchema('public',
      'UPDATE tenants SET stripe_subscription_id = $1, base_plan_type = $2 WHERE schema_name = $3',
      [subscription.id, basePlanType, tenantId]
    );
  }

  /**
   * Handle successful invoice payment
   * @param invoice - Stripe invoice object
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    console.log(`[BillingService] Invoice paid: ${invoice.id} for customer ${invoice.customer}`);

    // Get subscription ID from invoice - cast to any to access subscription property
    // Stripe's TypeScript types may not include this in all versions
    const subscriptionId = (invoice as any).subscription as string | undefined;
    if (!subscriptionId) return;

    const tenantResult = await this.db.queryInSchema('public',
      'SELECT schema_name FROM tenants WHERE stripe_subscription_id = $1',
      [subscriptionId]
    );

    if (tenantResult.rows.length > 0) {
      const tenantId = tenantResult.rows[0].schema_name;

      // Record payment in tenant_usage table
      await this.db.queryInSchema('public',
        `INSERT INTO tenant_payments (tenant_id, stripe_invoice_id, amount, status, paid_at)
         VALUES ($1, $2, $3, 'paid', NOW())
         ON CONFLICT (stripe_invoice_id) DO UPDATE SET
           paid_at = NOW(),
           status = 'paid'`,
        [tenantId, invoice.id, (invoice.amount_paid || 0) / 100]
      );

      // TODO: Send confirmation email via email service
      // await this.emailService.sendPaymentConfirmation(tenantId, invoice);
    }
  }

  /**
   * Handle failed invoice payment
   * @param invoice - Stripe invoice object
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.warn(`[BillingService] Invoice payment failed: ${invoice.id} for customer ${invoice.customer}`);

    // Get subscription ID from invoice - cast to any to access subscription property
    // Stripe's TypeScript types may not include this in all versions
    const subscriptionId = (invoice as any).subscription as string | undefined;
    if (!subscriptionId) return;

    const tenantResult = await this.db.queryInSchema('public',
      'SELECT schema_name FROM tenants WHERE stripe_subscription_id = $1',
      [subscriptionId]
    );

    if (tenantResult.rows.length > 0) {
      const tenantId = tenantResult.rows[0].schema_name;

      // Record failed payment
      await this.db.queryInSchema('public',
        `INSERT INTO tenant_payments (tenant_id, stripe_invoice_id, amount, status, attempted_at)
         VALUES ($1, $2, $3, 'failed', NOW())
         ON CONFLICT (stripe_invoice_id) DO UPDATE SET
           attempted_at = NOW(),
           status = 'failed'`,
        [tenantId, invoice.id, (invoice.amount_due || 0) / 100]
      );

      // TODO: Implement dunning management and email notification
      // 1. Check retry attempt count
      // 2. Send payment failed notification
      // 3. Schedule retry or cancel subscription if max retries reached
      // await this.emailService.sendPaymentFailed(tenantId, invoice);
      // await this.dunningService.handleFailedPayment(tenantId, invoice);
    }
  }

  /**
   * Build subscription items array for Stripe
   * Maps base plan type and add-on IDs to Stripe price IDs
   * @param basePlanType - Base plan type
   * @param addonIds - Array of add-on IDs
   * @returns Array of Stripe price IDs
   */
  private async buildSubscriptionItems(basePlanType: string, addonIds: string[]): Promise<string[]> {
    const items: string[] = [];

    // Add base plan price (skip for free tier)
    if (basePlanType !== 'free') {
      const priceId = STRIPE_PRICE_IDS[basePlanType as keyof typeof STRIPE_PRICE_IDS];
      if (priceId) {
        items.push(priceId);
      }
    }

    // Add add-on prices
    for (const addonId of addonIds) {
      // Try to get price ID from ADDON_PRICING first
      const addonPricing = ADDON_PRICING[addonId as keyof typeof ADDON_PRICING];
      if (addonPricing?.stripePriceId) {
        items.push(addonPricing.stripePriceId);
      }
      // Fallback to STRIPE_PRICE_IDS for base plans
      else {
        const priceId = STRIPE_PRICE_IDS[addonId as keyof typeof STRIPE_PRICE_IDS];
        if (priceId) {
          items.push(priceId);
        }
      }
    }

    return items;
  }

  /**
   * Add a subscription item to an existing Stripe subscription
   * Used when a tenant subscribes to an add-on after initial subscription creation
   * @param tenantId - The tenant schema_name identifier
   * @param addonId - The addon ID to subscribe to
   * @returns The Stripe subscription item ID
   * @throws Error if tenant has no active subscription or Stripe operation fails
   */
  async addSubscriptionItem(tenantId: string, addonId: string): Promise<string> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    // Get tenant's Stripe subscription ID
    const tenantResult = await this.db.queryInSchema('public',
      'SELECT stripe_subscription_id FROM tenants WHERE schema_name = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const subscriptionId = tenantResult.rows[0].stripe_subscription_id;
    if (!subscriptionId) {
      throw new Error(`Tenant ${tenantId} does not have an active Stripe subscription`);
    }

    // Get the Stripe price ID for this add-on using centralized constants
    const addonPricing = ADDON_PRICING[addonId as keyof typeof ADDON_PRICING];
    const priceId = addonPricing?.stripePriceId || STRIPE_PRICE_IDS[addonId as keyof typeof STRIPE_PRICE_IDS];

    if (!priceId) {
      throw new Error(`No Stripe price ID configured for add-on: ${addonId}`);
    }

    try {
      // Get current subscription to add new item
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      // Add the new item to the subscription
      // Note: We must explicitly set deleted: undefined to keep existing items
      // The Stripe types require this workaround for partial updates
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [
          // Keep existing subscription items by specifying their IDs
          ...subscription.items.data.map(item => ({
            id: item.id,
            // Explicitly cast to satisfy Stripe's type requirements
            ...(undefined as unknown as { deleted?: false }),
          })),
          { price: priceId },
        ],
        metadata: {
          tenant_id: tenantId,
        },
      });

      // Find the newly added item
      const newItem = updatedSubscription.items.data.find(item => item.price.id === priceId);
      if (!newItem) {
        throw new Error('Failed to create subscription item in Stripe');
      }

      return newItem.id;
    } catch (error) {
      console.error(`[BillingService] Failed to add subscription item for tenant ${tenantId}, addon ${addonId}:`, error);
      throw new Error(`Failed to add subscription item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribes a tenant to the Design Studio add-on (Deprecated - kept for compatibility)
   * @deprecated Use PricingService.subscribeToAddon instead
   */
  async subscribeToDesignStudio(tenantId: string) {
    await this.db.queryInSchema('public',
      `UPDATE tenants SET has_design_studio = TRUE WHERE schema_name = $1`,
      [tenantId]
    );
    return { success: true };
  }
}
