-- Test Tenant for n8n Theme Apply Workflow Testing
-- This creates a test tenant record with mock container data

-- Insert test tenant record
INSERT INTO public.tenants (
  business_name,
  schema_name,
  status,
  container_url,
  container_id,
  api_token,
  domain_name
) VALUES (
  'Test Business for Theme Workflow',
  'tenant_theme_test',
  'active',
  'https://replit.com/@testuser/theme-test-container',
  'theme-test-container-12345',
  'replit_test_token_' || encode(gen_random_bytes(16), 'hex'),
  'theme-test.codename.app'
)
ON CONFLICT (schema_name) DO UPDATE SET
  status = EXCLUDED.status,
  container_url = EXCLUDED.container_url,
  container_id = EXCLUDED.container_id,
  api_token = EXCLUDED.api_token,
  domain_name = EXCLUDED.domain_name;

-- Verify insertion
SELECT
  id,
  business_name,
  schema_name,
  status,
  container_url,
  container_id,
  domain_name,
  LEFT(api_token, 20) || '...' as api_token_preview
FROM public.tenants
WHERE schema_name = 'tenant_theme_test';
