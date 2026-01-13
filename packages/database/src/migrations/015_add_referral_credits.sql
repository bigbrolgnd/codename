ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS referral_credits_months INTEGER DEFAULT 0;
