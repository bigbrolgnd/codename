import { DatabaseManager } from '@codename/database';
import { z } from 'zod';

/**
 * Fraud detection thresholds
 */
const FRAUD_THRESHOLDS = {
  MAX_REFERRALS_30_DAYS: 10, // Maximum referrals allowed in 30 days
  MAX_SAME_IP_COUNT: 3, // Maximum referrals from same IP
  MAX_SELF_REFERRAL_ATTEMPTS: 2, // Maximum self-referral attempts before blocking
} as const;

export interface IPTracker {
  ip: string;
  count: number;
}

export interface FraudPattern {
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

/**
 * Tenant ID validation regex
 */
const TENANT_ID_REGEX = /^tenant_[a-z0-9_]+$/;

export class ReferralFraudService {
  constructor(private db: DatabaseManager) {}

  /**
   * Validate tenant ID format
   */
  private validateTenantId(tenantId: string): void {
    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new Error(
        `Invalid tenantId format: ${tenantId}. Must match pattern: tenant_[a-z0-9_]+`
      );
    }
  }

  /**
   * Check for suspicious referral activity
   * Detects unusually high referral volume that may indicate fraud
   * @param tenantId - The tenant to check
   * @returns true if suspicious activity detected
   */
  async checkSuspiciousActivity(tenantId: string): Promise<boolean> {
    this.validateTenantId(tenantId);

    // Check for > MAX_REFERRALS_30_DAYS referrals in last 30 days
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM public.referral_program
       WHERE referrer_tenant_id = $1
       AND created_at > NOW() - INTERVAL '30 days'`,
      [tenantId]
    );

    const count = parseInt(result.rows[0].count || '0', 10);
    return count > FRAUD_THRESHOLDS.MAX_REFERRALS_30_DAYS;
  }

  /**
   * Validate if a referee has made a payment (converted)
   * This is required before awarding referral bonuses
   * @param refereeId - The referee tenant ID to check
   * @returns true if referee has paid
   */
  async validateRefereePayment(refereeId: string): Promise<boolean> {
    this.validateTenantId(refereeId);

    const result = await this.db.query(
      `SELECT status, base_plan_type FROM public.tenants WHERE schema_name = $1`,
      [refereeId]
    );

    if (result.rows.length === 0) return false;

    const tenant = result.rows[0];
    const status = tenant.status;

    // Consider converted if active/provisioned AND not on free plan
    const isActive = status === 'active' || status === 'provisioned';
    const hasPaidPlan = tenant.base_plan_type && tenant.base_plan_type !== 'free';

    return isActive && hasPaidPlan;
  }

  /**
   * Track referral IP addresses to detect patterns
   * NOTE: This implementation checks for self-referral patterns
   * Full IP tracking requires capturing IP on registration
   * @param tenantId - The tenant to check
   * @returns Array of IPs with counts (placeholder implementation)
   */
  async trackReferralIPs(tenantId: string): Promise<IPTracker[]> {
    this.validateTenantId(tenantId);

    // TODO: Implement full IP tracking
    // Requires:
    // 1. Capture IP address on tenant registration
    // 2. Store in tenant metadata or separate table
    // 3. Query referees with same IP as referrer
    // 4. Return aggregated counts

    // For now, check if referrer has any self-referral attempts
    const result = await this.db.query(
      `SELECT
         COUNT(*) as self_referral_count
       FROM public.referral_program
       WHERE referrer_tenant_id = $1
       AND referrer_tenant_id = referee_tenant_id`,
      [tenantId]
    );

    const selfReferralCount = parseInt(result.rows[0].self_referral_count || '0', 10);

    if (selfReferralCount > 0) {
      return [{
        ip: 'self_referral',
        count: selfReferralCount
      }];
    }

    return [];
  }

  /**
   * Detect potential fraud patterns in referrals
   * Analyzes referral behavior for red flags
   * @param tenantId - The tenant to analyze
   * @returns Array of detected fraud patterns
   */
  async detectReferralPatterns(tenantId: string): Promise<FraudPattern[]> {
    this.validateTenantId(tenantId);

    const patterns: FraudPattern[] = [];

    // Pattern 1: High volume referrals in short time
    const highVolumeResult = await this.db.query(
      `SELECT COUNT(*) as count FROM public.referral_program
       WHERE referrer_tenant_id = $1
       AND created_at > NOW() - INTERVAL '30 days'`,
      [tenantId]
    );

    const highVolumeCount = parseInt(highVolumeResult.rows[0].count || '0', 10);
    if (highVolumeCount > FRAUD_THRESHOLDS.MAX_REFERRALS_30_DAYS) {
      patterns.push({
        pattern: 'high_volume',
        severity: 'high',
        description: `${highVolumeCount} referrals in 30 days exceeds threshold of ${FRAUD_THRESHOLDS.MAX_REFERRALS_30_DAYS}`
      });
    }

    // Pattern 2: Low conversion rate (many referrals, few conversions)
    const conversionResult = await this.db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'converted') as converted
       FROM public.referral_program
       WHERE referrer_tenant_id = $1`,
      [tenantId]
    );

    const pending = parseInt(conversionResult.rows[0].pending || '0', 10);
    const converted = parseInt(conversionResult.rows[0].converted || '0', 10);
    const total = pending + converted;

    if (total > 5 && converted === 0) {
      patterns.push({
        pattern: 'low_conversion',
        severity: 'medium',
        description: `${total} referrals with 0 conversions suggests potential fraud`
      });
    }

    // Pattern 3: Self-referral attempts
    const selfReferralResult = await this.db.query(
      `SELECT COUNT(*) as count FROM public.referral_program
       WHERE referrer_tenant_id = $1
       AND referrer_tenant_id = referee_tenant_id`,
      [tenantId]
    );

    const selfReferralCount = parseInt(selfReferralResult.rows[0].count || '0', 10);
    if (selfReferralCount > 0) {
      patterns.push({
        pattern: 'self_referral',
        severity: 'high',
        description: `${selfReferralCount} self-referral attempts detected`
      });
    }

    // Pattern 4: Cluster of referrals from same tenants (circular referrals)
    const circularResult = await this.db.query(
      `SELECT COUNT(DISTINCT referee_tenant_id) as unique_referees
       FROM public.referral_program
       WHERE referrer_tenant_id IN (
         SELECT referee_tenant_id FROM public.referral_program
         WHERE referrer_tenant_id = $1
       )
       AND referee_tenant_id = $1`,
      [tenantId]
    );

    const circularCount = parseInt(circularResult.rows[0].unique_referees || '0', 10);
    if (circularCount > 2) {
      patterns.push({
        pattern: 'circular_referral',
        severity: 'medium',
        description: `${circularCount} circular referral relationships detected`
      });
    }

    return patterns;
  }

  /**
   * Block a tenant from referral program due to fraud
   * @param tenantId - The tenant to block
   * @param reason - Reason for blocking
   */
  async blockReferrer(tenantId: string, reason: string): Promise<void> {
    this.validateTenantId(tenantId);

    await this.db.query(
      `UPDATE public.tenants
       SET referral_blocked = true,
           referral_blocked_reason = $1,
           referral_blocked_at = NOW()
       WHERE schema_name = $2`,
      [reason, tenantId]
    );
  }

  /**
   * Check if a tenant is blocked from referrals
   * @param tenantId - The tenant to check
   * @returns true if blocked
   */
  async isReferrerBlocked(tenantId: string): Promise<boolean> {
    this.validateTenantId(tenantId);

    const result = await this.db.query(
      `SELECT referral_blocked FROM public.tenants WHERE schema_name = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) return false;

    return result.rows[0].referral_blocked === true;
  }
}
