import { DatabaseManager } from '@codename/database';
import { BASE_PLAN_TYPES } from '@codename/api';
import { EmailService } from '../email.service';

/**
 * Tenant ID validation regex
 * Must match pattern: tenant_[a-z0-9_]+
 */
const TENANT_ID_REGEX = /^tenant_[a-z0-9_]+$/;

/**
 * VisitCapService
 *
 * Enforces free tier visit cap (5,000 visits/month).
 * Tracks visits, sends warnings, and enforces hard limits.
 *
 * Note on naming conventions:
 * - Application layer: camelCase (TypeScript/JavaScript convention)
 * - Database layer: snake_case (PostgreSQL convention)
 * Data transformation is handled by Zod schemas at API boundaries.
 */
export class VisitCapService {
  private emailService: EmailService;

  constructor(private db: DatabaseManager, emailService?: EmailService) {
    this.emailService = emailService || new EmailService();
  }

  /**
   * Track a visit for a tenant
   * Increments counter and checks if cap is reached
   * @param tenantId - The tenant schema_name identifier
   * @returns Object with allowed flag, remaining visits, and atCap flag
   * @throws Error if database operation fails or tenant not found
   */
  async trackVisit(tenantId: string): Promise<{allowed: boolean, remaining: number, atCap: boolean}> {
    // Validate tenantId format
    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new Error(`Invalid tenantId format: ${tenantId}. Must match pattern: tenant_[a-z0-9_]+`);
    }

    try {
      // Get tenant's visit cap and current count
      const result = await this.db.query(
        `SELECT monthly_visit_cap, current_month_visits, visit_cap_warning_sent, base_plan_type
         FROM public.tenants
         WHERE schema_name = $1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      const tenant = result.rows[0];
      const cap = tenant.monthly_visit_cap;
      const current = tenant.current_month_visits;
      const basePlanType = tenant.base_plan_type;

      // Only enforce cap for free tier users
      if (basePlanType !== 'free') {
        return { allowed: true, remaining: -1, atCap: false }; // Unlimited for paid plans
      }

      // Check if cap is reached
      if (current >= cap) {
        return { allowed: false, remaining: 0, atCap: true };
      }

      // Increment visit counter
      await this.db.query(
        `UPDATE public.tenants
         SET current_month_visits = current_month_visits + 1
         WHERE schema_name = $1`,
        [tenantId]
      );

      const remaining = cap - current - 1;
      const atCap = remaining === 0;

      // Send warning at 80% (4,000 visits for default 5,000 cap)
      const warningThreshold = Math.floor(cap * 0.8);
      if (!tenant.visit_cap_warning_sent && current >= warningThreshold) {
        await this.sendCapWarning(tenantId);
      }

      return { allowed: true, remaining, atCap };
    } catch (error) {
      console.error(`[VisitCapService] Failed to track visit for tenant ${tenantId}:`, error);
      throw new Error(`Failed to track visit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check current visit cap status for a tenant
   * @param tenantId - The tenant schema_name identifier
   * @returns Object with current visits, cap, and percentage used
   * @throws Error if database operation fails or tenant not found
   */
  async checkVisitCap(tenantId: string): Promise<{current: number, cap: number, percentage: number}> {
    // Validate tenantId format
    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new Error(`Invalid tenantId format: ${tenantId}. Must match pattern: tenant_[a-z0-9_]+`);
    }

    try {
      const result = await this.db.query(
        `SELECT monthly_visit_cap, current_month_visits, base_plan_type
         FROM public.tenants
         WHERE schema_name = $1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      const tenant = result.rows[0];
      const cap = tenant.monthly_visit_cap;
      const current = tenant.current_month_visits;
      const basePlanType = tenant.base_plan_type;

      // Free tier users have a cap, paid users don't
      if (basePlanType !== 'free') {
        return { current, cap: -1, percentage: 0 };
      }

      const percentage = Math.min(100, Math.round((current / cap) * 100));

      return {
        current,
        cap,
        percentage,
      };
    } catch (error) {
      console.error(`[VisitCapService] Failed to check visit cap for tenant ${tenantId}:`, error);
      throw new Error(`Failed to check visit cap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset monthly visit counters for all tenants
   * Should be run via cron job on the 1st of each month
   * @throws Error if database operation fails
   */
  async resetMonthlyCounters(): Promise<void> {
    try {
      await this.db.query(
        `UPDATE public.tenants
         SET current_month_visits = 0,
             visit_cap_warning_sent = FALSE,
             last_visit_count_reset = NOW()
         WHERE base_plan_type = 'free'`
      );

      console.log('[VisitCapService] Monthly visit counters reset for all free tier tenants');
    } catch (error) {
      console.error('[VisitCapService] Failed to reset monthly counters:', error);
      throw new Error(`Failed to reset monthly counters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send cap warning email to tenant
   * Sends at 80% of visit cap (4,000 visits for default 5,000 cap)
   * AC5: Sends actual email via EmailService
   * @param tenantId - The tenant schema_name identifier
   * @throws Error if email service fails
   */
  async sendCapWarning(tenantId: string): Promise<void> {
    // Validate tenantId format
    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new Error(`Invalid tenantId format: ${tenantId}. Must match pattern: tenant_[a-z0-9_]+`);
    }

    try {
      // Get tenant details for email
      const result = await this.db.query(
        `SELECT t.business_name, t.base_plan_type, t.monthly_visit_cap, t.current_month_visits,
                u.email
         FROM public.tenants t
         LEFT JOIN public.users u ON u.tenant_id = t.schema_name
         WHERE t.schema_name = $1
         LIMIT 1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        console.warn(`[VisitCapService] Cannot send warning: tenant ${tenantId} not found`);
        return;
      }

      const tenant = result.rows[0];
      const email = tenant.email;
      const businessName = tenant.business_name || 'there';
      const cap = tenant.monthly_visit_cap;
      const current = tenant.current_month_visits;

      if (!email) {
        console.warn(`[VisitCapService] Cannot send warning: no email found for tenant ${tenantId}`);
        return;
      }

      // Mark warning as sent before sending email to avoid duplicates on retry
      await this.db.query(
        `UPDATE public.tenants SET visit_cap_warning_sent = TRUE WHERE schema_name = $1`,
        [tenantId]
      );

      // AC5: Send email via EmailService
      await this.emailService.sendVisitCapWarning(email, businessName, current, cap);

      console.log(`[VisitCapService] Cap warning email sent to ${email} for ${businessName}: ${current}/${cap} visits`);
    } catch (error) {
      console.error(`[VisitCapService] Failed to send cap warning for tenant ${tenantId}:`, error);
      // Don't throw - warning failures shouldn't block operations
    }
  }

  /**
   * Enforce visit cap by returning upgrade prompt data
   * @param tenantId - The tenant schema_name identifier
   * @returns Object with upgrade prompt data
   */
  async enforceCap(tenantId: string): Promise<{
    message: string;
    upgradeUrl: string;
    currentVisits: number;
    visitCap: number;
  }> {
    // Validate tenantId format
    if (!TENANT_ID_REGEX.test(tenantId)) {
      throw new Error(`Invalid tenantId format: ${tenantId}. Must match pattern: tenant_[a-z0-9_]+`);
    }

    const capStatus = await this.checkVisitCap(tenantId);

    return {
      message: `You've reached your monthly visit limit (${capStatus.current}/${capStatus.cap}). Upgrade to Standard for unlimited visits.`,
      upgradeUrl: `/pricing?upgrade=standard&tenant=${tenantId}`,
      currentVisits: capStatus.current,
      visitCap: capStatus.cap,
    };
  }
}
