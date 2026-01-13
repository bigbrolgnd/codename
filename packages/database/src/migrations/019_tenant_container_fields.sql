-- Migration: Add container fields for n8n Theme Apply workflow
-- This migration adds fields needed for the n8n workflow to update theme.css in tenant containers

-- Add container_url: The Replit container base URL for file operations
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS container_url TEXT;

-- Add container_id: The Replit container identifier
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS container_id TEXT;

-- Add api_token: The Replit API token for container file operations (encrypted)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS api_token TEXT;

-- Add domain_name: The tenant's custom domain or subdomain
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS domain_name TEXT;

-- Add index for faster lookups by schema_name (used by n8n workflow)
CREATE INDEX IF NOT EXISTS idx_tenants_schema_name
  ON public.tenants(schema_name);

-- Add index for active tenant lookups
CREATE INDEX IF NOT EXISTS idx_tenants_status
  ON public.tenants(status);

-- Add comment for documentation
COMMENT ON COLUMN public.tenants.container_url IS 'Replit container base URL for file operations (e.g., https://replit.com/@user/container)';
COMMENT ON COLUMN public.tenants.container_id IS 'Replit container identifier';
COMMENT ON COLUMN public.tenants.api_token IS 'Replit API token for authentication (should be encrypted in production)';
COMMENT ON COLUMN public.tenants.domain_name IS 'Tenant custom domain (e.g., example.codename.app)';
