-- Pricing Configuration Seed Data
-- Initial seed data for all add-ons
-- Uses ON CONFLICT for idempotency (can be run multiple times)

-- ROLLBACK: DELETE FROM public.pricing_config WHERE addon_id IN (...all seed IDs...);

BEGIN;

-- FREE social integrations (Instagram, Discord, Facebook, Pinterest, Bluesky, Threads, Substack)
INSERT INTO public.pricing_config (addon_id, name, category, price_cents, description, is_active)
VALUES
  ('instagram-feed', 'Instagram Feed', 'free', 0, 'Auto-sync Instagram posts to your site', TRUE),
  ('discord-feed', 'Discord Feed', 'free', 0, 'Display Discord server activity', TRUE),
  ('facebook-feed', 'Facebook Feed', 'free', 0, 'Show Facebook page posts', TRUE),
  ('pinterest-feed', 'Pinterest Feed', 'free', 0, 'Display Pinterest pins', TRUE),
  ('bluesky-feed', 'Bluesky Feed', 'free', 0, 'Show Bluesky posts', TRUE),
  ('threads-feed', 'Threads Feed', 'free', 0, 'Display Threads posts', TRUE),
  ('substack-feed', 'Substack Feed', 'free', 0, 'Embed Substack articles', TRUE)
ON CONFLICT (addon_id) DO NOTHING;

-- PREMIUM workflow add-ons
INSERT INTO public.pricing_config (addon_id, name, category, price_cents, billing_interval, description, requires_base_plan, is_active)
VALUES
  ('smart-calendar', 'Smart Calendar', 'premium', 1499, 'monthly', 'Conflict-free appointment scheduling', TRUE, TRUE),
  ('booking-system', 'Booking System', 'premium', 1999, 'monthly', 'Full booking management with deposits', TRUE, TRUE),
  ('payment-processing', 'Payment Links', 'premium', 799, 'monthly', 'Accept payments via Stripe', TRUE, TRUE),
  ('review-gallery', 'Review Gallery', 'premium', 999, 'monthly', 'Display Google reviews with auto-sync', TRUE, TRUE),
  ('social-feed-pro', 'Social Feed Pro', 'premium', 1299, 'monthly', 'Advanced social media aggregation', TRUE, TRUE)
ON CONFLICT (addon_id) DO NOTHING;

-- AI features (token-based)
INSERT INTO public.pricing_config (addon_id, name, category, price_cents, token_multiplier, requires_ai_plan, description, is_active)
VALUES
  ('ai-content-generator', 'AI Content Generator', 'ai', 25, 5, TRUE, 'Generate blog posts from $0.25/article', TRUE),
  ('ai-image-alt', 'AI Image Alt Text', 'ai', 5, 5, TRUE, 'Auto-generate alt text from $0.05/image', TRUE),
  ('ai-seo-optimizer', 'AI SEO Optimizer', 'ai', 50, 5, TRUE, 'Optimize content for SEO from $0.50/page', TRUE)
ON CONFLICT (addon_id) DO NOTHING;

-- Infrastructure add-ons
INSERT INTO public.pricing_config (addon_id, name, category, price_cents, billing_interval, description, requires_base_plan, is_active)
VALUES
  ('custom-domain', 'Custom Domain', 'infrastructure', 999, 'monthly', 'Connect your own domain', TRUE, TRUE),
  ('domain-registration', 'Domain Registration', 'infrastructure', 1999, 'one-time', 'Register a new domain via Cloudflare', TRUE, TRUE),
  ('priority-email', 'Priority Email Support', 'infrastructure', 2999, 'monthly', 'Priority email support', TRUE, TRUE)
ON CONFLICT (addon_id) DO NOTHING;

-- Verify seed data count (should be 20 total add-ons)
DO $$
BEGIN
  RAISE NOTICE 'Pricing config seeded: % add-ons loaded', (SELECT COUNT(*) FROM public.pricing_config);
END $$;

COMMIT;
