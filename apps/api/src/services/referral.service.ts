import { DatabaseManager } from '@codename/database';
import { z } from 'zod';

/**
 * Tenant ID validation regex
 * Must match pattern: tenant_[a-z0-9_]+
 */
const TENANT_ID_REGEX = /^tenant_[a-z0-9_]+$/;

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  monthsEarned: number;
}

export class ReferralService {
  constructor(private db: DatabaseManager) {}

  /**
   * Validate tenant ID format
   * @throws Error if tenantId format is invalid
   */
  private validateTenantId(tenantId: string): void {
    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new Error(
        `Invalid tenantId format: ${tenantId}. Must match pattern: tenant_[a-z0-9_]+`
      );
    }
  }

  /**
   * Generate referral code for a tenant
   * Format: social_{tenantId}
   * @param tenantId - The tenant schema_name identifier
   * @returns Referral code string
   * @throws Error if tenantId format is invalid
   */
  generateReferralCode(tenantId: string): string {
    this.validateTenantId(tenantId);
    return `social_${tenantId}`;
  }

  /**
   * Validate if a referral code exists and belongs to a valid tenant
   * @param code - Referral code to validate
   * @returns true if code is valid and tenant exists
   */
  async validateReferralCode(code: string): Promise<boolean> {
    if (!code.startsWith('social_')) {
      return false;
    }

    const tenantId = code.replace('social_', '');

    // Validate tenant ID format first
    if (!TENANT_ID_REGEX.test(tenantId)) {
      return false;
    }

    const result = await this.db.query(
      `SELECT schema_name FROM public.tenants WHERE schema_name = $1`,
      [tenantId]
    );

    return result.rows.length > 0;
  }

  /**
   * Track a referral relationship
   * Uses ON CONFLICT to prevent duplicate tracking of same referrer-referee pair
   * @param referrerId - The tenant schema_name of the referrer
   * @param refereeId - The tenant schema_name of the referee
   * @throws Error if validation fails or database operation fails
   */
  async trackReferral(referrerId: string, refereeId: string): Promise<void> {
    this.validateTenantId(referrerId);
    this.validateTenantId(refereeId);

    if (referrerId === refereeId) {
      throw new Error('Referrer and referee cannot be the same tenant');
    }

    const code = this.generateReferralCode(referrerId);

    // ON CONFLICT DO NOTHING prevents duplicate tracking
    await this.db.query(
      `INSERT INTO public.referral_program
       (referrer_tenant_id, referee_tenant_id, referral_code, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (referrer_tenant_id, referee_tenant_id) DO NOTHING`,
      [referrerId, refereeId, code]
    );
  }

  /**
   * Process referral reward when referee converts
   * Updates referral status and credits both referrer and referee with 1 free month
   * @param refereeId - The tenant schema_name of the referee who converted
   * @returns Object with referrerReward and refereeReward (number of months)
   * @throws Error if database operation fails
   */
  async processReferralReward(refereeId: string): Promise<{
    referrerReward: number;
    refereeReward: number;
  }> {
    this.validateTenantId(refereeId);

    // 1. Find the pending referral record
    const result = await this.db.query(
      `SELECT id, referrer_tenant_id FROM public.referral_program
       WHERE referee_tenant_id = $1 AND status = 'pending'`,
      [refereeId]
    );

    if (result.rows.length === 0) {
      return { referrerReward: 0, refereeReward: 0 };
    }

    const referral = result.rows[0];
    const referrerId = referral.referrer_tenant_id;

    // 2. Update status to converted (only if still pending to prevent race conditions)
    const updateResult = await this.db.query(
      `UPDATE public.referral_program
       SET status = 'converted', converted_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING id`,
      [referral.id]
    );

    // If no rows were updated, already converted
    if (updateResult.rows.length === 0) {
      return { referrerReward: 0, refereeReward: 0 };
    }

    // 3. Credit rewards (1 month each) - use separate queries for clarity
    await this.db.query(
      `UPDATE public.tenants
       SET referral_credits_months = referral_credits_months + 1
       WHERE schema_name = $1`,
      [referrerId]
    );

    await this.db.query(
      `UPDATE public.tenants
       SET referral_credits_months = referral_credits_months + 1
       WHERE schema_name = $1`,
      [refereeId]
    );

    return { referrerReward: 1, refereeReward: 1 };
  }

  /**
   * Get referral statistics for a tenant
   * @param tenantId - The tenant schema_name identifier
   * @returns Referral statistics including totals, pending, and earned months
   * @throws Error if validation fails or database operation fails
   */
  async getReferralStats(tenantId: string): Promise<ReferralStats> {
    this.validateTenantId(tenantId);

    const result = await this.db.query(
      `SELECT
         COUNT(*) as total_referrals,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_referrals,
         SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as months_earned
        FROM public.referral_program
        WHERE referrer_tenant_id = $1`,
      [tenantId]
    );

    const row = result.rows[0];
    return {
      totalReferrals: parseInt(row.total_referrals || '0', 10),
      pendingReferrals: parseInt(row.pending_referrals || '0', 10),
      monthsEarned: parseInt(row.months_earned || '0', 10),
    };
  }
}
