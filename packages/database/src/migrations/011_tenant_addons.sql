-- Tenant Add-ons Tracking Table
-- Junction table tracking which add-ons each tenant has subscribed to
-- Targets public schema as subscriptions are tenant metadata

-- ROLLBACK: DROP TABLE IF EXISTS public.tenant_addons CASCADE;

CREATE TABLE IF NOT EXISTS public.tenant_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES public.tenants(schema_name) ON DELETE CASCADE,
  addon_id TEXT NOT NULL REFERENCES public.pricing_config(addon_id) ON DELETE CASCADE,
  stripe_subscription_item_id TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(tenant_id, addon_id)
);

-- Index for tenant lookups (get all add-ons for a tenant)
CREATE INDEX IF NOT EXISTS idx_tenant_addons_tenant_id ON public.tenant_addons(tenant_id);

-- Index for addon reverse lookups (find all tenants with specific add-on)
CREATE INDEX IF NOT EXISTS idx_tenant_addons_addon_id ON public.tenant_addons(addon_id);

-- Index for active subscriptions filtering
CREATE INDEX IF NOT EXISTS idx_tenant_addons_active ON public.tenant_addons(tenant_id, is_active);

-- Comment for documentation
COMMENT ON TABLE public.tenant_addons IS 'Tracks tenant subscriptions to add-ons with Stripe integration';
COMMENT ON COLUMN public.tenant_addons.stripe_subscription_item_id IS 'Stripe subscription item ID for billing';
COMMENT ON COLUMN public.tenant_addons.cancelled_at IS 'Set when subscription is cancelled, NULL if active';
