-- Migration: Add pgcrypto extension and encrypt existing api_tokens
-- This adds encryption for sensitive API tokens using pgcrypto

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt API tokens
CREATE OR REPLACE FUNCTION encrypt_api_token(plaintext TEXT, key TEXT DEFAULT 'replit-token-key')
RETURNS TEXT AS $$
BEGIN
  -- Use pgp_sym_encrypt for symmetric encryption
  -- The key should come from environment variable in production
  RETURN encode(
    pgp_sym_encrypt(plaintext, key),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to decrypt API tokens
CREATE OR REPLACE FUNCTION decrypt_api_token(ciphertext TEXT, key TEXT DEFAULT 'replit-token-key')
RETURNS TEXT AS $$
BEGIN
  -- Decrypt the base64-encoded encrypted token
  RETURN pgp_sym_decrypt(
    decode(ciphertext, 'base64'),
    key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Existing api_token values remain in plain text for backward compatibility
-- New tokens should use encrypt_api_token() function
-- To migrate existing tokens, run: UPDATE public.tenants SET api_token = encrypt_api_token(api_token) WHERE api_token IS NOT NULL AND api_token NOT LIKE 'encrypted%';

-- Add comment documenting the encryption
COMMENT ON FUNCTION encrypt_api_token IS 'Encrypt API tokens using pgcrypto symmetric encryption';
COMMENT ON FUNCTION decrypt_api_token IS 'Decrypt API tokens encrypted with encrypt_api_token()';

-- For production: Create a migration script to encrypt all existing tokens
-- This would require the REPLIT_ENCRYPTION_KEY environment variable
-- UPDATE public.tenants
-- SET api_token = encrypt_api_token(api_token)
-- WHERE api_token IS NOT NULL
--   AND api_token NOT LIKE 'encrypted=%';
