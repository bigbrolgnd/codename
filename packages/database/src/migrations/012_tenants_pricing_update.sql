-- Tenants Table Pricing Update
-- Removes old plan_tier system and adds new pricing model fields
-- Adds visit tracking for free tier cap enforcement

-- ROLLBACK:
-- ALTER TABLE public.tenants DROP COLUMN IF EXISTS base_plan_type, billing_interval, stripe_customer_id,
--   stripe_subscription_id, monthly_visit_cap, current_month_visits, visit_cap_warning_sent, last_visit_count_reset;
-- ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'basic' CHECK (plan_tier IN ('basic', 'growth', 'pro'));
-- DROP INDEX IF EXISTS idx_tenants_base_plan_type;

-- Drop old plan_tier column (basic/growth/pro)
ALTER TABLE public.tenants DROP COLUMN IF EXISTS plan_tier;

-- Add new base_plan_type column (free/standard/ai_powered)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS base_plan_type TEXT DEFAULT 'free' CHECK (base_plan_type IN ('free', 'standard', 'ai_powered')),
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'quarterly', 'annual')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add visit tracking for free tier cap enforcement
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS monthly_visit_cap INTEGER DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS current_month_visits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visit_cap_warning_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_visit_count_reset TIMESTAMPTZ DEFAULT NOW();

-- Migrate existing tenants: if they had design_studio, set to standard, otherwise free
UPDATE public.tenants
SET base_plan_type = CASE
  WHEN has_design_studio = TRUE THEN 'standard'
  ELSE 'free'
END
WHERE base_plan_type IS NULL OR base_plan_type = 'free';

-- Index for base_plan_type filtering (find all free tier users)
CREATE INDEX IF NOT EXISTS idx_tenants_base_plan_type ON public.tenants(base_plan_type);

-- Comment for documentation
COMMENT ON COLUMN public.tenants.base_plan_type IS 'New pricing model: free, standard, ai_powered';
COMMENT ON COLUMN public.tenants.monthly_visit_cap IS 'Free tier visit limit (default 5000)';
COMMENT ON COLUMN public.tenants.current_month_visits IS 'Counter for current month visits';
COMMENT ON COLUMN public.tenants.visit_cap_warning_sent IS 'Track if 80% warning email sent (prevents duplicates)';
COMMENT ON COLUMN public.tenants.last_visit_count_reset IS 'Last timestamp monthly visit counter was reset';
