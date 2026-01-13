CREATE TABLE IF NOT EXISTS public.referral_program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_tenant_id TEXT NOT NULL REFERENCES public.tenants(schema_name),
  referee_tenant_id TEXT REFERENCES public.tenants(schema_name),
  referral_code TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'converted', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  UNIQUE (referrer_tenant_id, referee_tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_code ON public.referral_program(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_referrer ON public.referral_program(referrer_tenant_id);
CREATE INDEX IF NOT EXISTS idx_referral_status ON public.referral_program(status);

COMMENT ON TABLE public.referral_program IS 'Tracks referral relationships between tenants';
COMMENT ON COLUMN public.referral_program.referrer_tenant_id IS 'Tenant who sent the referral';
COMMENT ON COLUMN public.referral_program.referee_tenant_id IS 'Tenant who was referred';
COMMENT ON COLUMN public.referral_program.status IS 'pending = not yet paid, converted = referee became paying customer';
