-- Add subscription and plan fields to tenants
-- These are in the public schema as they apply to the entire tenant identity

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'basic' CHECK (plan_tier IN ('basic', 'growth', 'pro')),
ADD COLUMN IF NOT EXISTS has_design_studio BOOLEAN DEFAULT FALSE;

-- Update existing default tenant for testing
UPDATE public.tenants 
SET plan_tier = 'basic', has_design_studio = FALSE 
WHERE schema_name = 'tenant_default';
