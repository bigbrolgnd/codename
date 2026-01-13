/**
 * Pricing Sync Script
 *
 * Reads pricing configuration from the database and writes to pricing.json
 * for the marketing site. This allows marketing site to display current pricing
 * without database access.
 *
 * Usage: npm run sync-pricing
 */

import { DatabaseManager } from '@codename/database';
import { BASE_PLAN_PRICES, FREE_TIER_VISIT_CAP } from '../apps/api/src/services/admin/pricing.constants';
import * as fs from 'fs';
import * as path from 'path';

interface PricingConfig {
  addon_id: string;
  name: string;
  category: 'free' | 'premium' | 'ai' | 'infrastructure';
  price_cents: number;
  billing_interval: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  token_multiplier: number;
  requires_base_plan: boolean;
  requires_ai_plan: boolean;
  description: string;
  is_active: boolean;
}

interface MarketingPricingJson {
  updatedAt: string;
  basePlans: {
    free: { price: number; display: string; features: string[] };
    standard: { price: number; display: string; features: string[] };
    ai_powered: { price: number; display: string; features: string[] };
  };
  addons: {
    free: Array<{ id: string; name: string; description: string }>;
    premium: Array<{ id: string; name: string; priceCents: number; priceDisplay: string; description: string }>;
    ai: Array<{ id: string; name: string; tokenMultiplier: number; description: string }>;
    infrastructure: Array<{ id: string; name: string; priceCents: number; priceDisplay: string; description: string }>;
  };
}

async function syncPricing() {
  console.log('[PricingSync] Starting pricing synchronization...');

  const db = new DatabaseManager();

  try {
    // Fetch all active pricing configurations
    const result = await db.query(
      `SELECT addon_id, name, category, price_cents, billing_interval,
              token_multiplier, requires_base_plan, requires_ai_plan,
              description, is_active
       FROM public.pricing_config
       WHERE is_active = TRUE
       ORDER BY category, name`
    );

    const pricingConfigs: PricingConfig[] = result.rows;

    console.log(`[PricingSync] Fetched ${pricingConfigs.length} pricing configurations from database`);

    // Build marketing site pricing structure using centralized constants
    const marketingPricing: MarketingPricingJson = {
      updatedAt: new Date().toISOString(),
      basePlans: {
        free: {
          price: BASE_PLAN_PRICES.free,
          display: '$0',
          features: [
            `${FREE_TIER_VISIT_CAP.toLocaleString()} visits/month`,
            '7 social integrations',
            'AI-powered site building',
            'SEO basics',
            'Free subdomain',
          ],
        },
        standard: {
          price: BASE_PLAN_PRICES.standard, // $39/mo in cents
          display: '$39',
          features: [
            'Unlimited visits',
            'Everything in Free',
            'Premium add-ons available',
            'Priority support',
            'Custom domain',
          ],
        },
        ai_powered: {
          price: BASE_PLAN_PRICES.ai_powered, // $79/mo in cents
          display: '$79',
          features: [
            'Unlimited visits',
            'Everything in Standard',
            'All premium add-ons included',
            'AI features included',
            'Design studio access',
          ],
        },
      },
      addons: {
        free: [],
        premium: [],
        ai: [],
        infrastructure: [],
      },
    };

    // Categorize add-ons
    for (const config of pricingConfigs) {
      const addon = {
        id: config.addon_id,
        name: config.name,
        description: config.description || '',
      };

      if (config.category === 'free') {
        marketingPricing.addons.free.push(addon);
      } else if (config.category === 'premium') {
        marketingPricing.addons.premium.push({
          ...addon,
          priceCents: config.price_cents,
          priceDisplay: `$${(config.price_cents / 100).toFixed(2)}`,
        });
      } else if (config.category === 'ai') {
        marketingPricing.addons.ai.push({
          ...addon,
          tokenMultiplier: config.token_multiplier,
        });
      } else if (config.category === 'infrastructure') {
        marketingPricing.addons.infrastructure.push({
          ...addon,
          priceCents: config.price_cents,
          priceDisplay: `$${(config.price_cents / 100).toFixed(2)}`,
        });
      }
    }

    // Write to marketing site
    const outputPath = path.resolve(__dirname, '../apps/marketing-site/public/pricing.json');
    const outputDir = path.dirname(outputPath);

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      console.log(`[PricingSync] Creating directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write JSON file with pretty formatting
    fs.writeFileSync(outputPath, JSON.stringify(marketingPricing, null, 2), 'utf-8');

    console.log(`[PricingSync] Successfully wrote pricing data to ${outputPath}`);
    console.log(`[PricingSync] Summary:`);
    console.log(`  - Free add-ons: ${marketingPricing.addons.free.length}`);
    console.log(`  - Premium add-ons: ${marketingPricing.addons.premium.length}`);
    console.log(`  - AI add-ons: ${marketingPricing.addons.ai.length}`);
    console.log(`  - Infrastructure add-ons: ${marketingPricing.addons.infrastructure.length}`);
    console.log(`[PricingSync] Sync complete!`);

  } catch (error) {
    console.error('[PricingSync] Failed to sync pricing:', error);
    process.exit(1);
  }
}

// Run the sync
syncPricing()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('[PricingSync] Unhandled error:', error);
    process.exit(1);
  });
