import { DatabaseManager } from '@codename/database';
import { BILLING_CONFIG } from './billing.constants';
import { usageCache } from './usage.cache';
import { PLAN_TIERS } from '@codename/api';

export { usageCache };

export class BillingService {
  constructor(private db: DatabaseManager) {}

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
   */
  async getSubscriptionStatus(tenantId: string) {
    const result = await this.db.queryInSchema('public',
      `SELECT plan_tier, has_design_studio FROM tenants WHERE schema_name = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return {
        planTier: 'basic',
        hasDesignStudio: false,
        canAccessDesignStudio: false
      };
    }

    const row = result.rows[0];
    return {
      planTier: row.plan_tier,
      hasDesignStudio: row.has_design_studio,
      // Design Studio is accessible if on Pro tier OR if they have the specific add-on
      canAccessDesignStudio: row.plan_tier === PLAN_TIERS.PRO || row.has_design_studio === true
    };
  }

  /**
   * Subscribes a tenant to the Design Studio add-on (Simulated)
   */
  async subscribeToDesignStudio(tenantId: string) {
    await this.db.queryInSchema('public',
      `UPDATE tenants SET has_design_studio = TRUE WHERE schema_name = $1`,
      [tenantId]
    );
    return { success: true };
  }
}
