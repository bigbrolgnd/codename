-- Migration: Create orchestration_audit_log table for theme deployment tracking
-- This tracks all n8n orchestration events for compliance and debugging

CREATE TABLE IF NOT EXISTS public.orchestration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  container_id TEXT,
  domain_name TEXT,
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  details JSONB,
  error_message TEXT,
  theme_version INTEGER,
  css_length INTEGER,
  replit_response_code INTEGER,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for querying by tenant
CREATE INDEX IF NOT EXISTS idx_orchestration_audit_log_tenant
  ON public.orchestration_audit_log(tenant_id);

-- Add index for querying by event type
CREATE INDEX IF NOT EXISTS idx_orchestration_audit_log_event
  ON public.orchestration_audit_log(event_type);

-- Add index for querying by date
CREATE INDEX IF NOT EXISTS idx_orchestration_audit_log_executed_at
  ON public.orchestration_audit_log(executed_at DESC);

-- Add index for querying by status (for error monitoring)
CREATE INDEX IF NOT EXISTS idx_orchestration_audit_log_status
  ON public.orchestration_audit_log(status);

-- Add comments for documentation
COMMENT ON TABLE public.orchestration_audit_log IS 'Audit trail for n8n orchestration events (theme deployment, etc.)';
COMMENT ON COLUMN public.orchestration_audit_log.event_type IS 'Event type (e.g., THEME_PUBLISHED, CONTAINER_UPDATE)';
COMMENT ON COLUMN public.orchestration_audit_log.status IS 'Execution status: success, failed, or partial';
COMMENT ON COLUMN public.orchestration_audit_log.details IS 'Additional event data as JSONB';
COMMENT ON COLUMN public.orchestration_audit_log.css_length IS 'Length of generated CSS for theme events';
COMMENT ON COLUMN public.orchestration_audit_log.replit_response_code IS 'HTTP response code from Replit API';
