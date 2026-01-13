# Znapsite API Credentials & Authentication Reference

**Last Updated:** 2026-01-08
**Purpose:** Central reference for all third-party API credentials used in the znapsite.com platform.
**Security:** Keep this file private. Never commit secrets to public repositories.

---

## Table of Contents

1. [Social Media APIs](#social-media-apis)
2. [Payment & Billing](#payment--billing)
3. [Communication & Notifications](#communication--notifications)
4. [Infrastructure & Deployment](#infrastructure--deployment)
5. [AI & Automation](#ai--automation)
6. [Database & Storage](#database--storage)
7. [Security & Rate Limiting](#security--rate-limiting)
8. [Environment Variables](#environment-variables)

---

## Social Media APIs

### Instagram Graph API (Meta)

**Purpose:** Extract business profile data (name, bio, profile picture) when users paste Instagram URLs during onboarding.

| Credential | Value |
|------------|-------|
| **App ID** (Client ID) | `1406547891259535` |
| **App Secret** | `d864223425cfc89afa0f3ea08c2b496b` |
| **Access Token** | `EAAe9N3S30xkBQX6YNZBvfoNoWo71b3VxZCZCUtecSb1Ru6KAZANQ6AbHszlsZB6DWnw0BUOVOvik2wLaacLZBfU3VZAmdwsN0P3s8ONGtUWqpX9z8wo6GIVMU3bxt87H6HTqkb3HQmtZBYZBYyZC1yGplZARVhPpmvFZCd9V3UJRDtE2jrI5mQXfLVYtzogsoyT5Ad9x2npyfcZAkN7gFnHau2wZCBWHszf0anfnl7XPZAGefCFTRMTYz17uTaw4hyEZBvdwart1EvArAMXa9nOGkqnxztXC2KZBPLSLZADfRlIWxooQZDZD` |
| **API Version** | v18.0 |
| **OAuth Redirect URI** | `https://znapsite.com/auth/instagram/callback` |
| **Scopes** | `instagram_basic`, `pages_show_list` |

**Documentation:** https://developers.facebook.com/docs/instagram-api/

**Endpoints Used:**
- OAuth Dialog: `https://www.facebook.com/v18.0/dialog/oauth`
- Token Exchange: `https://graph.facebook.com/v18.0/oauth/access_token`
- Long-Lived Token: `https://graph.instagram.com/access_token`
- User Pages: `https://graph.facebook.com/v18.0/me/accounts`
- Profile Data: `https://graph.facebook.com/v18.0/{instagram_business_id}`

**Token Expiry:** 60 days (users must re-authorize)

---

### Meta (Facebook) API

**Purpose:** OAuth flow for Instagram Business Account access.

| Setting | Value |
|---------|-------|
| **Developer Portal** | https://developers.facebook.com/apps/ |
| **Deauthorize Callback** | `https://znapsite.com/auth/instagram/deauthorize` |
| **Data Deletion URL** | `https://znapsite.com/auth/instagram/delete-data` |

---

## Payment & Billing

### Stripe

**Purpose:** Subscription management, deposit processing, payment handling.

| Credential | Value |
|------------|-------|
| **Publishable Key** | `pk_live_...` (To be added) |
| **Secret Key** | `sk_live_...` (To be added) |
| **Webhook Secret** | `whsec_...` (To be added) |
| **Product IDs** | (To be configured) |

**Environment Variables:**
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Documentation:** https://stripe.com/docs/api

**Features:**
- Subscription tiers (Free / Standard $39/mo / AI-Powered $79/mo)
- Add-on marketplace (Calendar $14.99/mo, Payments $7.99/mo, etc.)
- Deposit capture for bookings
- Invoice generation
- Webhook for payment events

---

## Communication & Notifications

### Twilio

**Purpose:** SMS/WhatsApp notifications for bookings and missed call text-back.

| Credential | Value |
|------------|-------|
| **Account SID** | `AC...` (To be added) |
| **Auth Token** | (To be added) |
| **WhatsApp Sender ID** | (To be added) |
| **SMS Sender Number** | (To be added) |

**Environment Variables:**
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_NUMBER=+15551234567
```

**Documentation:** https://www.twilio.com/docs/sms
**Documentation:** https://www.twilio.com/docs/whatsapp

**Features:**
- Booking confirmations to business owner
- Booking confirmations to customer
- Missed call text-back automation

---

### Vapi.ai (Voice Receptionist)

**Purpose:** AI-powered phone answering for Pro tier.

| Credential | Value |
|------------|-------|
| **API Key** | (To be added) |
| **Phone Number** | (To be added) |

**Environment Variables:**
```bash
VAPI_API_KEY=...
VAPI_PHONE_NUMBER=+15551234567
```

**Documentation:** https://docs.vapi.ai/

**Features:**
- Conversational AI for phone handling
- Integration with booking calendar
- 100 minutes/month included in Pro tier

---

## Infrastructure & Deployment

### Cloudflare

**Purpose:** DNS management, CDN caching, rate limiting, Turnstile captcha.

| Credential | Value |
|------------|-------|
| **API Token** | `DlWeE1MEzGMXiXoUpnpd7o_fYDcDS8jCHNu19Q0f` |
| **Account Email** | `aimee@b2acashbuyers.com` |
| **Zone ID - b2ainvestments.com** | `7e079f419357dba76d279374c76d5036` |
| **Zone ID - znapsite.com** | (To be added) |
| **Turnstile Site Key** | (To be added) |
| **Turnstile Secret Key** | (To be added) |

**Environment Variables:**
```bash
CLOUDFLARE_API_TOKEN=DlWeE1MEzGMXiXoUpnpd7o_fYDcDS8jCHNu19Q0f
CLOUDFLARE_ACCOUNT_EMAIL=aimee@b2acashbuyers.com
CLOUDFLARE_ZONE_ID=...
TURNSTILE_SITE_KEY=0x...
TURNSTILE_SECRET_KEY=0x...
```

**Documentation:** https://developers.cloudflare.com/api/

**Features:**
- DNS automation for domain provisioning
- Edge caching for static assets
- Turnstile captcha on AI-triggering endpoints
- Worker for failover routing

---

### IONOS

**Purpose:** Domain registration, email SMTP.

| Credential | Value |
|------------|-------|
| **API Key** | (To be added) |
| **SMTP Host** | `smtp.ionos.com` |
| **SMTP Port** | `587` |
| **SMTP User** | `info@b2ainvestments.com` |
| **SMTP Password** | (To be added) |

**Environment Variables:**
```bash
IONOS_API_KEY=...
IONOS_SMTP_HOST=smtp.ionos.com
IONOS_SMTP_PORT=587
IONOS_SMTP_USER=info@b2ainvestments.com
IONOS_SMTP_PASSWORD=...
```

**Documentation:** https://developer.ionos.com/

**Features:**
- Automatic domain purchasing
- DNS record management
- Transactional email sending

---

### Replit

**Purpose:** Isolated tenant containers for customer websites.

| Credential | Value |
|------------|-------|
| **API Token** | (To be added) |
| **Team ID** | (To be added) |

**Environment Variables:**
```bash
REPLIT_API_TOKEN=replit_...
REPLIT_TEAM_ID=...
```

**Documentation:** https://doc.replit.com/

**Features:**
- Container provisioning
- Keep-alive ping scheduling
- Auto-scaling deployments

---

## AI & Automation

### OpenAI (GPT Models)

**Purpose:** AI content generation, design agent, support agent.

| Credential | Value |
|------------|-------|
| **API Key** | `sk-proj-...` (To be added) |
| **Organization ID** | (To be added) |

**Environment Variables:**
```bash
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG_ID=org-...
```

**Documentation:** https://platform.openai.com/docs/api-reference

**Models Used:**
- `gpt-4-turbo` - Design agent, complex tasks
- `gpt-3.5-turbo` - Cost-aware routing for simple tasks

---

### Zhipu AI (GLM-4)

**Purpose:** Cost-efficient AI for majority of interactions (high margins).

| Credential | Value |
|------------|-------|
| **API Key** | (To be added) |

**Environment Variables:**
```bash
GLM_API_KEY=...
```

**Documentation:** https://open.bigmodel.cn/dev/api

**Features:**
- Primary LLM for cost-aware routing
- Vision capabilities for price list OCR
- Blog post generation

---

### n8n

**Purpose:** Workflow orchestration, zero-touch provisioning, automation.

| Setting | Value |
|---------|-------|
| **Instance URL** | `https://n8n.b2ainvestments.com` |
| **API Key** | (To be added) |

**Environment Variables:**
```bash
N8N_API_KEY=...
N8N_WEBHOOK_URL=https://n8n.b2ainvestments.com/
```

**Documentation:** https://docs.n8n.io/

**Workflows:**
- Zero-touch provisioning (Domain → DNS → DB → Replit)
- Smart calendar with buffer logic
- Review guardian auto-replies
- Social media auto-pilot
- Missed call text-back
- Keep-alive scheduling

---

## Database & Storage

### Supabase

**Purpose:** Tenant database, real-time subscriptions, authentication.

| Credential | Value |
|------------|-------|
| **Project URL** | `https://*.supabase.co` (To be added) |
| **Anon Key** | (To be added) |
| **Service Role Key** | (To be added) |
| **Database URL** | (To be added) |

**Environment Variables:**
```bash
SUPABASE_URL=https://*.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
```

**Documentation:** https://supabase.com/docs

**Features:**
- Schema-based tenant isolation
- Row Level Security (RLS)
- Real-time for live updates
- Edge Functions for rate limiting

---

## Security & Rate Limiting

### Cloudflare Turnstile

**Purpose:** Bot protection on public AI-triggering endpoints.

| Credential | Value |
|------------|-------|
| **Site Key** | (To be added) |
| **Secret Key** | (To be added) |

**Environment Variables:**
```bash
TURNSTILE_SITE_KEY=0x...
TURNSTILE_SECRET_KEY=0x...
```

**Documentation:** https://developers.cloudflare.com/turnstile/

---

## Environment Variables

### Production (.env)

```bash
# === Instagram OAuth ===
INSTAGRAM_CLIENT_ID=1406547891259535
INSTAGRAM_CLIENT_SECRET=d864223425cfc89afa0f3ea08c2b496b
INSTAGRAM_REDIRECT_URI=https://znapsite.com/auth/instagram/callback

# === Stripe ===
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# === Twilio ===
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_NUMBER=+15551234567

# === Cloudflare ===
CLOUDFLARE_API_TOKEN=DlWeE1MEzGMXiXoUpnpd7o_fYDcDS8jCHNu19Q0f
CLOUDFLARE_ACCOUNT_EMAIL=aimee@b2acashbuyers.com
TURNSTILE_SITE_KEY=0x...
TURNSTILE_SECRET_KEY=0x...

# === IONOS ===
IONOS_API_KEY=...
IONOS_SMTP_HOST=smtp.ionos.com
IONOS_SMTP_PORT=587
IONOS_SMTP_USER=info@b2ainvestments.com
IONOS_SMTP_PASSWORD=...

# === Replit ===
REPLIT_API_TOKEN=replit_...
REPLIT_TEAM_ID=...

# === OpenAI ===
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG_ID=org-...

# === GLM-4 ===
GLM_API_KEY=...

# === n8n ===
N8N_API_KEY=...
N8N_WEBHOOK_URL=https://n8n.b2ainvestments.com/

# === Supabase ===
SUPABASE_URL=https://*.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...

# === Vapi.ai ===
VAPI_API_KEY=...
VAPI_PHONE_NUMBER=+15551234567
```

### Docker Compose Secret Injection

For `docker-compose.yml`, use `secrets` or environment files for sensitive values:

```yaml
services:
  codename:
    environment:
      - INSTAGRAM_CLIENT_ID=${INSTAGRAM_CLIENT_ID}
      - INSTAGRAM_CLIENT_SECRET=${INSTAGRAM_CLIENT_SECRET}
    env_file:
      - .env
```

---

## Token Management & Rotation

### Access Token Expiry

| Service | Token Lifetime | Rotation Strategy |
|---------|---------------|-------------------|
| Instagram Graph API | 60 days | User re-authorization required |
| Stripe | No expiry | Rotate if compromised |
| Supabase | No expiry | Rotate if compromised |
| Cloudflare API Token | No expiry | Rotate annually |
| OpenAI API Key | No expiry | Rotate if compromised |

### Monitoring

- **Token Vampire Protection:** Rate limit at 10 requests/hour per tenant
- **Cost Cap Alert:** Alert at 20% revenue trajectory
- **Circuit Breaker:** Auto-disable AI features when limit reached

---

## Security Best Practices

1. **Never commit secrets to git** - Use environment variables
2. **Principle of Least Privilege** - Use scoped tokens with minimal permissions
3. **Rotate credentials** - At least annually, or immediately if compromised
4. **Monitor usage** - Track API costs and set up alerts
5. **Webhook verification** - Always verify webhook signatures
6. **Secrets management** - Consider using a secrets manager (e.g., HashiCorp Vault) for production

---

## Contact

For questions about API credentials or to report compromised keys, contact the platform administrator.

---

*This file is maintained as part of the znapsite.com platform documentation.*
