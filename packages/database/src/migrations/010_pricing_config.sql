-- Pricing Configuration Table
-- Stores all available add-ons with pricing and categorization
-- Targets public schema as pricing is global across all tenants

-- ROLLBACK: DROP TABLE IF EXISTS public.pricing_config CASCADE;

CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('free', 'premium', 'ai', 'infrastructure')),
  price_cents INTEGER DEFAULT 0,
  billing_interval TEXT CHECK (billing_interval IN ('monthly', 'quarterly', 'annual', 'one-time')),
  token_multiplier INTEGER DEFAULT 5,
  requires_base_plan BOOLEAN DEFAULT TRUE,
  requires_ai_plan BOOLEAN DEFAULT FALSE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for addon_id lookups (primary query pattern)
CREATE INDEX IF NOT EXISTS idx_pricing_config_addon_id ON public.pricing_config(addon_id);

-- Index for category and is_active filtering (UI component picker)
CREATE INDEX IF NOT EXISTS idx_pricing_config_category_active ON public.pricing_config(category, is_active);

-- Comment for documentation
COMMENT ON TABLE public.pricing_config IS 'Pricing configuration for all add-ons available to tenants';
COMMENT ON COLUMN public.pricing_config.addon_id IS 'Unique slug identifier for the add-on (e.g., smart-calendar)';
COMMENT ON COLUMN public.pricing_config.category IS 'Type of add-on: free (social APIs), premium (workflows), ai (token-based), infrastructure (hosting/domains)';
COMMENT ON COLUMN public.pricing_config.price_cents IS 'Price in cents (NULL for free, integer for paid)';
COMMENT ON COLUMN public.pricing_config.token_multiplier IS 'Markup multiplier for AI features (default 5x on API costs)';
COMMENT ON COLUMN public.pricing_config.requires_base_plan IS 'TRUE = must have Standard/AI plan to use this add-on';
COMMENT ON COLUMN public.pricing_config.requires_ai_plan IS 'TRUE = only available with AI-Powered base plan';
