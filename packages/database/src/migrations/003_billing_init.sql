-- Billing and Usage Tracking
-- Targets public schema since it tracks all tenants

CREATE TABLE IF NOT EXISTS public.tenant_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(schema_name) ON DELETE CASCADE,
    month_year DATE NOT NULL, -- First day of the month
    ai_tokens_used INTEGER DEFAULT 0,
    visits_total INTEGER DEFAULT 0,
    overage_fees_cents INTEGER DEFAULT 0,
    is_capped BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, month_year)
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_tenant_usage_lookup ON public.tenant_usage(tenant_id, month_year);
