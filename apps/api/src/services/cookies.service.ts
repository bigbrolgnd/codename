/**
 * Analytics Service
 *
 * Server-side analytics tracking for visitor behavior and conversion tracking.
 * Handles GDPR/CCPA compliant event tracking via database storage.
 *
 * NOTE: Cookie management is handled client-side in the dashboard.
 * This service only provides database-backed analytics storage.
 *
 * Uses existing analytics_events table for conversion tracking.
 */

import { DatabaseManager } from '@codename/database';
import { z } from 'zod';

// Types
export type ConversionStage = 'free' | 'engaged' | 'pricing' | 'trial' | 'paid';

export interface ConversionStatus {
  visitorId: string;
  firstVisit: Date;
  lastVisit: Date;
  visitCount: number;
  currentStage: ConversionStage;
  stagesVisited: ConversionStage[];
}

// Zod schemas for input validation
const PageViewDataSchema = z.object({
  url: z.string().max(2048).regex(/^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/),
  referrer: z.string().max(2048).optional(),
  userAgent: z.string().max(512).optional(),
  city: z.string().max(100).optional(),
  county: z.string().max(100).optional(),
});

const ComponentInteractionDataSchema = z.object({
  componentId: z.string().max(100),
  componentType: z.string().max(50),
  action: z.enum(['click', 'view', 'hover', 'submit', 'custom']),
  metadata: z.record(z.any()).optional(),
});

export type PageViewData = z.infer<typeof PageViewDataSchema>;
export type ComponentInteractionData = z.infer<typeof ComponentInteractionDataSchema>;

/**
 * Tenant ID validation regex
 * Must match pattern: tenant_[a-z0-9_]+
 */
const TENANT_ID_REGEX = /^tenant_[a-z0-9_]+$/;

/**
 * Visitor ID validation regex
 * Must match pattern: v_{timestamp}_{random}
 */
const VISITOR_ID_REGEX = /^v_\d+_[a-z0-9]+$/;

export class ConversionCookiesService {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

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
   * Validate visitor ID format
   * @throws Error if visitorId format is invalid
   */
  private validateVisitorId(visitorId: string): void {
    if (!VISITOR_ID_REGEX.test(visitorId)) {
      throw new Error(
        `Invalid visitorId format: ${visitorId}. Must match pattern: v_{timestamp}_{random}`
      );
    }
  }

  /**
   * Generate a unique visitor ID
   * Format: v_{timestamp}_{random_string}
   */
  generateVisitorId(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate a session ID
   * Format: s_{timestamp}_{random_string}
   */
  generateSessionId(): string {
    return `s_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Track a visit for analytics - uses existing visit_logs table
   * @param tenantId - The tenant schema_name identifier
   * @param visitorId - Unique visitor identifier
   * @param pageData - Optional page view data
   * @throws Error if validation fails or database operation fails
   */
  async trackVisit(
    tenantId: string,
    visitorId: string,
    pageData?: PageViewData
  ): Promise<void> {
    this.validateTenantId(tenantId);
    this.validateVisitorId(visitorId);

    // Validate pageData if provided
    const validatedData = pageData ? PageViewDataSchema.parse(pageData) : undefined;

    // Use existing visit_logs table in tenant schema
    const query = `
      INSERT INTO visit_logs (visitor_id, page_path, referrer, city, county, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT DO NOTHING
    `;

    await this.db.queryInSchema(tenantId, query, [
      visitorId,
      validatedData?.url || '/',
      validatedData?.referrer || null,
      validatedData?.city || null,
      validatedData?.county || null,
    ]);

    // Also track conversion event in public analytics_events
    await this.trackAnalyticsEvent(tenantId, visitorId, 'visit', {
      url: validatedData?.url,
      referrer: validatedData?.referrer,
    });
  }

  /**
   * Track a page view - uses existing visit_logs table
   * @param tenantId - The tenant schema_name identifier
   * @param visitorId - Unique visitor identifier
   * @param pageData - Page view data (required)
   * @throws Error if validation fails or database operation fails
   */
  async trackPageView(
    tenantId: string,
    visitorId: string,
    pageData: PageViewData
  ): Promise<void> {
    this.validateTenantId(tenantId);
    this.validateVisitorId(visitorId);

    // Validate input
    const validatedData = PageViewDataSchema.parse(pageData);

    // Use existing visit_logs table in tenant schema
    const query = `
      INSERT INTO visit_logs (visitor_id, page_path, referrer, city, county, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await this.db.queryInSchema(tenantId, query, [
      visitorId,
      validatedData.url,
      validatedData.referrer || null,
      validatedData.city || null,
      validatedData.county || null,
    ]);

    // Also track in public analytics_events
    await this.trackAnalyticsEvent(tenantId, visitorId, 'page_view', {
      url: validatedData.url,
      referrer: validatedData.referrer,
      user_agent: validatedData.userAgent,
    });
  }

  /**
   * Track component interaction - uses analytics_events table
   * @param tenantId - The tenant schema_name identifier
   * @param visitorId - Unique visitor identifier
   * @param interactionData - Component interaction data
   * @throws Error if validation fails or database operation fails
   */
  async trackComponentInteraction(
    tenantId: string,
    visitorId: string,
    interactionData: ComponentInteractionData
  ): Promise<void> {
    this.validateTenantId(tenantId);
    this.validateVisitorId(visitorId);

    // Validate input
    const validatedData = ComponentInteractionDataSchema.parse(interactionData);

    await this.trackAnalyticsEvent(tenantId, visitorId, 'component_interaction', {
      component_id: validatedData.componentId,
      component_type: validatedData.componentType,
      action: validatedData.action,
      ...validatedData.metadata,
    });
  }

  /**
   * Track an analytics event in the public analytics_events table
   * @param tenantId - The tenant schema_name identifier
   * @param visitorId - Unique visitor identifier
   * @param eventName - Name of the event to track
   * @param properties - Event properties (will be JSON stringified)
   * @throws Error if database operation fails
   */
  async trackAnalyticsEvent(
    tenantId: string,
    visitorId: string,
    eventName: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    const query = `
      INSERT INTO public.analytics_events (tenant_id, visitor_id, event_name, properties, timestamp)
      VALUES ($1, $2, $3, $4, NOW())
    `;

    await this.db.query(query, [tenantId, visitorId, eventName, JSON.stringify(properties)]);
  }

  /**
   * Get conversion status for a visitor
   * Queries analytics_events table for conversion tracking
   * @param tenantId - The tenant schema_name identifier
   * @param visitorId - Unique visitor identifier
   * @returns Conversion status with visit history and stages
   * @throws Error if database operation fails
   */
  async getConversionStatus(
    tenantId: string,
    visitorId: string
  ): Promise<ConversionStatus> {
    this.validateTenantId(tenantId);
    this.validateVisitorId(visitorId);

    // Get visit data from visit_logs
    const visitQuery = `
      SELECT
        MIN(created_at) as first_visit,
        MAX(created_at) as last_visit,
        COUNT(DISTINCT created_at::date) as visit_count
      FROM visit_logs
      WHERE visitor_id = $1
    `;

    const visitResult = await this.db.queryInSchema(tenantId, visitQuery, [visitorId]);

    // Get latest conversion stage from analytics_events
    const stageQuery = `
      SELECT properties->>'stage' as current_stage,
             properties->>'stages_visited' as stages_visited
      FROM public.analytics_events
      WHERE tenant_id = $1
        AND visitor_id = $2
        AND event_name = 'conversion_stage_update'
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const stageResult = await this.db.query(stageQuery, [tenantId, visitorId]);
    const stageRow = stageResult.rows[0];

    const currentStage: ConversionStage = (stageRow?.current_stage as ConversionStage) || 'free';
    const stagesVisited: ConversionStage[] = stageRow?.stages_visited
      ? JSON.parse(stageRow.stages_visited)
      : ['free'];

    if (!visitResult.rows[0]) {
      return {
        visitorId,
        firstVisit: new Date(),
        lastVisit: new Date(),
        visitCount: 1,
        currentStage,
        stagesVisited,
      };
    }

    const visitRow = visitResult.rows[0];

    return {
      visitorId,
      firstVisit: new Date(visitRow.first_visit),
      lastVisit: new Date(visitRow.last_visit),
      visitCount: visitRow.visit_count || 1,
      currentStage,
      stagesVisited,
    };
  }

  /**
   * Update conversion stage
   * Only allows forward movement through the funnel (prevents downgrades)
   * @param tenantId - The tenant schema_name identifier
   * @param visitorId - Unique visitor identifier
   * @param newStage - New conversion stage
   * @throws Error if validation fails or database operation fails
   */
  async updateConversionStage(
    tenantId: string,
    visitorId: string,
    newStage: ConversionStage
  ): Promise<void> {
    this.validateTenantId(tenantId);
    this.validateVisitorId(visitorId);

    const status = await this.getConversionStatus(tenantId, visitorId);

    // Only update if moving forward in the funnel
    if (this.shouldUpdateStage(status.currentStage, newStage)) {
      const stagesVisited = status.stagesVisited.includes(newStage)
        ? status.stagesVisited
        : [...status.stagesVisited, newStage];

      // Track conversion stage update in analytics_events
      await this.trackAnalyticsEvent(tenantId, visitorId, 'conversion_stage_update', {
        stage: newStage,
        stages_visited: stagesVisited,
        previous_stage: status.currentStage,
      });
    }
  }

  /**
   * Check if stage should be updated (prevents moving backward)
   * @param current - Current conversion stage
   * @param newStage - Proposed new stage
   * @returns true if new stage is later in funnel than current
   */
  private shouldUpdateStage(current: ConversionStage, newStage: ConversionStage): boolean {
    const stageOrder: ConversionStage[] = ['free', 'engaged', 'pricing', 'trial', 'paid'];
    const currentIndex = stageOrder.indexOf(current);
    const newIndex = stageOrder.indexOf(newStage);

    return newIndex > currentIndex;
  }

  /**
   * Auto-detect conversion stage based on behavior
   * Analyzes visit patterns and page views to determine conversion stage
   * @param tenantId - The tenant schema_name identifier
   * @param visitorId - Unique visitor identifier
   * @returns Detected conversion stage
   * @throws Error if database operation fails
   */
  async detectConversionStage(
    tenantId: string,
    visitorId: string
  ): Promise<ConversionStage> {
    this.validateTenantId(tenantId);
    this.validateVisitorId(visitorId);

    const status = await this.getConversionStatus(tenantId, visitorId);

    // Check for pricing page views using analytics_events
    const pricingQuery = `
      SELECT COUNT(*) as count
      FROM public.analytics_events
      WHERE tenant_id = $1
        AND visitor_id = $2
        AND event_name = 'page_view'
        AND properties->>'url' LIKE '%pricing%'
    `;

    const pricingResult = await this.db.query(pricingQuery, [tenantId, visitorId]);
    const pricingViews = parseInt(pricingResult.rows[0]?.count || '0', 10);

    // Check for high engagement (3+ page views or 2+ visits)
    if (status.visitCount >= 2 || await this.getPageViewCount(tenantId, visitorId) >= 3) {
      if (pricingViews > 0) {
        return 'pricing';
      }
      return 'engaged';
    }

    return status.currentStage;
  }

  /**
   * Get total page view count for visitor
   * @param tenantId - The tenant schema_name identifier
   * @param visitorId - Unique visitor identifier
   * @returns Total page view count
   * @throws Error if database operation fails
   */
  private async getPageViewCount(tenantId: string, visitorId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM visit_logs
      WHERE visitor_id = $1
    `;

    const result = await this.db.queryInSchema(tenantId, query, [visitorId]);
    return parseInt(result.rows[0]?.count || '0', 10);
  }
}

export default ConversionCookiesService;
