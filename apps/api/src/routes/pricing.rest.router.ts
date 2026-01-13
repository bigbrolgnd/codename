/**
 * Pricing REST API Router
 * Express router for pricing configuration and subscription management
 * REST endpoints for fetching pricing data, calculating totals, and managing add-on subscriptions
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseManager } from '@codename/database';
import { PricingService } from '../services/admin/pricing.service';
import { BillingService } from '../services/admin/billing.service';
import { VisitCapService } from '../services/admin/visit-cap.service';
import type { PricingConfig } from '@codename/api';

const router = Router();
const db = new DatabaseManager();
const billingService = new BillingService(db);
const pricingService = new PricingService(db, billingService);
const visitCapService = new VisitCapService(db);

// =====================================================
// Middleware
// =====================================================

/**
 * Validates request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 * @throws 400 with validation errors if body is invalid
 */
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        message: result.error.errors[0]?.message || 'Invalid input',
        details: result.error.errors,
      });
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates URL parameter against a Zod schema
 * @param param - Parameter name to validate
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 * @throws 400 with validation errors if parameter is invalid
 */
function validateParam(param: string, schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params[param]);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        message: `Invalid ${param}`,
        details: result.error.errors,
      });
    }
    next();
  };
}

/**
 * Async handler wrapper to catch errors and pass to Express error handler
 * @param fn - Async route handler function
 * @returns Express middleware function that wraps the handler
 */
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Authentication middleware
 *
 * ⚠️ SECURITY WARNING: This is a PLACEHOLDER implementation for development.
 * In production, this must be replaced with proper authentication:
 * - JWT token validation from Authorization header
 * - WebAuthn passkey verification
 * - Session management and CSRF protection
 *
 * Current behavior: Accepts any x-tenant-id header value (after format validation)
 * Security risk: Any user can impersonate any tenant by setting the header
 *
 * TODO: Implement proper authentication in a dedicated auth story
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Get tenant ID from header
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required: x-tenant-id header missing',
    });
  }

  // Basic format validation for tenant ID
  const TENANT_ID_REGEX = /^tenant_[a-z0-9_]+$/;
  if (!TENANT_ID_REGEX.test(tenantId)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid tenant ID format. Must match pattern: tenant_[a-z0-9_]+',
    });
  }

  // ⚠️ SECURITY: No actual authentication happens here
  // In production, verify JWT/WebAuthn token and ensure user owns this tenant
  req.tenantId = tenantId;
  next();
}

// Extend Express Request type
declare module 'express' {
  interface Request {
    tenantId?: string;
  }
}

/**
 * Error handler for the router
 */
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[PricingAPI] Error:', error);

  if (error.code === '23505') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists',
      details: { constraint: error.constraint },
    });
  }

  if (error.code === '23503') {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Referenced resource does not exist',
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
  });
});

// =====================================================
// Zod Schemas for Validation
// =====================================================

const SubscribeAddonSchema = z.object({
  addonId: z.string().min(1, 'Addon ID is required'),
});

const UnsubscribeAddonSchema = z.object({
  addonId: z.string().min(1, 'Addon ID is required'),
});

const CalculatePricingSchema = z.object({
  basePlanType: z.enum(['free', 'standard', 'ai_powered']).optional(),
  addonIds: z.array(z.string()).optional().default([]),
});

// =====================================================
// PUBLIC PRICING ENDPOINTS
// =====================================================

/**
 * GET /api/pricing
 * Returns all pricing configurations (public, no auth required)
 * Used by marketing site to display pricing table
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const pricing = await pricingService.getAllPricing();

    res.json({
      pricing: pricing.map((p: PricingConfig) => ({
        addonId: p.addon_id,
        name: p.name,
        category: p.category,
        priceCents: p.price_cents,
        billingInterval: p.billing_interval,
        tokenMultiplier: p.token_multiplier,
        requiresBasePlan: p.requires_base_plan,
        requiresAiPlan: p.requires_ai_plan,
        description: p.description,
        isActive: p.is_active,
      })),
      total: pricing.length,
    });
  })
);

/**
 * GET /api/pricing/category/:category
 * Returns pricing configurations filtered by category
 */
router.get(
  '/category/:category',
  validateParam('category', z.enum(['free', 'premium', 'ai', 'infrastructure'])),
  asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;
    const pricing = await pricingService.getPricingByCategory(category);

    res.json({
      category,
      pricing: pricing.map((p: PricingConfig) => ({
        addonId: p.addon_id,
        name: p.name,
        category: p.category,
        priceCents: p.price_cents,
        billingInterval: p.billing_interval,
        tokenMultiplier: p.token_multiplier,
        requiresBasePlan: p.requires_base_plan,
        requiresAiPlan: p.requires_ai_plan,
        description: p.description,
        isActive: p.is_active,
      })),
      total: pricing.length,
    });
  })
);

/**
 * POST /api/pricing/calculate
 * Calculates total monthly pricing for a given configuration
 * Used by marketing site pricing calculator
 */
router.post(
  '/calculate',
  validateBody(CalculatePricingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { basePlanType = 'free', addonIds } = req.body;

    // Calculate base plan pricing
    const basePrices: Record<string, number> = {
      free: 0,
      standard: 3900, // $39/mo in cents
      ai_powered: 7900, // $79/mo in cents
    };

    let totalCents = basePrices[basePlanType] || 0;
    const includedAddons: string[] = [];

    // AI-Powered plan includes all add-ons
    if (basePlanType === 'ai_powered') {
      includedAddons.push('All add-ons included');
    } else {
      // For Free/Standard, calculate add-on costs
      const allPricing = await pricingService.getAllPricing();
      const premiumAndInfrastructure = allPricing.filter(
        (p: PricingConfig) => p.category === 'premium' || p.category === 'infrastructure'
      );

      for (const addonId of addonIds) {
        const addon = premiumAndInfrastructure.find((p: PricingConfig) => p.addon_id === addonId);
        if (addon) {
          totalCents += addon.price_cents || 0;
          includedAddons.push(addon.name);
        }
      }
    }

    res.json({
      basePlanType,
      basePriceCents: basePrices[basePlanType] || 0,
      addOnsPriceCents: totalCents - (basePrices[basePlanType] || 0),
      totalPriceCents: totalCents,
      totalPriceDisplay: `$${(totalCents / 100).toFixed(2)}`,
      includedAddons,
      isAiPowered: basePlanType === 'ai_powered',
    });
  })
);

// =====================================================
// AUTHENTICATED ENDPOINTS
// =====================================================

/**
 * POST /api/pricing/subscribe
 * Subscribe a tenant to an add-on
 * Requires authentication
 */
router.post(
  '/subscribe',
  requireAuth,
  validateBody(SubscribeAddonSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { addonId } = req.body;
    const tenantId = req.tenantId!;

    const subscription = await pricingService.subscribeToAddon(tenantId, addonId);

    res.status(201).json({
      id: subscription.id,
      tenantId: subscription.tenant_id,
      addonId: subscription.addon_id,
      stripeSubscriptionItemId: subscription.stripe_subscription_item_id,
      isActive: subscription.is_active,
      subscribedAt: subscription.subscribed_at,
      cancelledAt: subscription.cancelled_at,
    });
  })
);

/**
 * DELETE /api/pricing/unsubscribe
 * Unsubscribe a tenant from an add-on
 * Requires authentication
 */
router.delete(
  '/unsubscribe',
  requireAuth,
  // For DELETE, we'll send addonId in query body
  asyncHandler(async (req: Request, res: Response) => {
    const { addonId } = req.body;
    const tenantId = req.tenantId!;

    if (!addonId) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'addonId is required',
      });
    }

    await pricingService.unsubscribeFromAddon(tenantId, addonId);

    res.status(204).send();
  })
);

/**
 * GET /api/pricing/tenant/:tenantId
 * Get all active add-ons for a tenant
 * Requires authentication
 */
router.get(
  '/tenant/:tenantId',
  requireAuth,
  validateParam('tenantId', z.string().min(1)),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.params;

    // Verify the authenticated user owns this tenant
    if (req.tenantId !== tenantId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this tenant',
      });
    }

    const addons = await pricingService.getTenantAddons(tenantId);
    const monthlyTotal = await pricingService.calculateMonthlyTotal(tenantId);

    res.json({
      tenantId,
      addons: addons.map((addon: any) => ({
        id: addon.id,
        addonId: addon.addon_id,
        stripeSubscriptionItemId: addon.stripe_subscription_item_id,
        isActive: addon.is_active,
        subscribedAt: addon.subscribed_at,
        cancelledAt: addon.cancelled_at,
        // Include pricing details from join
        name: addon.name,
        category: addon.category,
        priceCents: addon.price_cents,
      })),
      monthlyTotalCents: monthlyTotal,
      monthlyTotalDisplay: `$${(monthlyTotal / 100).toFixed(2)}`,
      total: addons.length,
    });
  })
);

/**
 * GET /api/pricing/tenant/:tenantId/visit-cap
 * Get visit cap status for a tenant
 * Requires authentication
 */
router.get(
  '/tenant/:tenantId/visit-cap',
  requireAuth,
  validateParam('tenantId', z.string().min(1)),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = req.params;

    // Verify the authenticated user owns this tenant
    if (req.tenantId !== tenantId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this tenant',
      });
    }

    const capStatus = await visitCapService.checkVisitCap(tenantId);

    res.json({
      tenantId,
      currentVisits: capStatus.current,
      visitCap: capStatus.cap,
      percentageUsed: capStatus.percentage,
      isFreeTier: capStatus.cap > 0,
      remainingVisits: capStatus.cap > 0 ? Math.max(0, capStatus.cap - capStatus.current) : -1,
    });
  })
);

export default router;
