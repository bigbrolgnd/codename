/**
 * Stripe Webhook Router
 * Express router for handling Stripe webhook events
 * Verifies webhook signatures and routes events to appropriate handlers
 */

import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { DatabaseManager } from '@codename/database';
import { BillingService } from '../services/admin/billing.service';

const router = Router();
const db = new DatabaseManager();
const billingService = new BillingService(db);

// Get Stripe secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.warn('[StripeWebhook] STRIPE_SECRET_KEY not set - webhooks will fail');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any,
});

/**
 * Async handler wrapper to catch errors
 */
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error handler for the router
 */
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[StripeWebhook] Error:', error);

  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
  });
});

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 * Verifies signature using STRIPE_WEBHOOK_SECRET
 */
router.post(
  '/stripe',
  asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      console.warn('[StripeWebhook] Request missing Stripe signature');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing Stripe signature',
      });
    }

    if (!stripeWebhookSecret) {
      console.error('[StripeWebhook] STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Webhook secret not configured',
      });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    } catch (err: any) {
      console.error('[StripeWebhook] Signature verification failed:', err.message);
      return res.status(400).json({
        error: 'Invalid Signature',
        message: err.message,
      });
    }

    console.log(`[StripeWebhook] Received event: ${event.type} (ID: ${event.id})`);

    try {
      // Handle the event using BillingService
      const result = await billingService.handleWebhook(event);

      // Return 200 OK to acknowledge receipt
      res.json({
        received: true,
        eventId: event.id,
        eventType: event.type,
        ...result,
      });
    } catch (error: any) {
      console.error(`[StripeWebhook] Failed to handle event ${event.type}:`, error);
      // Return 200 to avoid webhook retries - we've logged the error for manual investigation
      // Stripe will not retry if we return 2xx, preventing infinite retry loops
      res.status(200).json({
        received: true,
        handled: false,
        error: 'Webhook Handler Failed',
        message: error.message,
        eventId: event.id,
        eventType: event.type,
      });
    }
  })
);

/**
 * GET /api/webhooks/stripe/health
 * Health check endpoint for webhook route
 */
router.get('/stripe/health', (req: Request, res: Response) => {
  const isConfigured = !!(stripeSecretKey && stripeWebhookSecret);

  res.json({
    status: 'ok',
    webhook: 'stripe',
    configured: isConfigured,
    hasSecretKey: !!stripeSecretKey,
    hasWebhookSecret: !!stripeWebhookSecret,
  });
});

export default router;
