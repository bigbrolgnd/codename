# CLAUDE.md - codename WaaS Platform

**codename** is a WaaS (Website as a Service) Factory - multi-tenant AI-powered website creation platform.

---

## 🤖 Automatic Skill Loading

The following keywords automatically trigger specialized skills:

### n8n Workflow Skills (Auto-Load)
**Trigger phrases**:
- "Build a new n8n workflow"
- "Create n8n workflow"
- "Add n8n workflow"
- "Edit n8n workflow"
- "Import workflow into n8n"
- "Activate n8n workflow"
- "List n8n workflows"
- "Get webhook URL"
- "n8n workflow"
- "GLM Vision workflow"
- "Theme apply workflow"

**Skills loaded**: n8n-mcp-tools-expert, n8n-workflow-patterns, n8n-manager

### Database Migration Skills (Auto-Load)
**Trigger phrases**:
- "Run migration"
- "Apply migration"
- "Database migration"
- "Supabase migration"
- "ALTER TABLE"
- "Create migration"
- "Migration 019/020/021/022/023/024/etc"
- "RLS migration"
- "Enable RLS"
- "Add column to table"
- "Create index"

**Skills loaded**: supabase-migrations

### Code & Expression Skills (Auto-Load)
**Trigger phrases**:
- "Write Code node"
- "Add Code node"
- "n8n Code node"
- "n8n expression"
- "Write n8n expression"
- "Fix n8n expression"
- "validate expression"
- "JavaScript in n8n"

**Skills loaded**: n8n-code-javascript, n8n-expression-syntax

### Validation Skills (Auto-Load)
**Trigger phrases**:
- "Validate workflow"
- "Check workflow"
- "Validate n8n config"
- "Fix validation error"
- "Validation failed"
- "Check node configuration"
- "Validate node config"

**Skills loaded**: n8n-validation-expert, n8n-node-configuration

### Dev Story Skills (Auto-Load)
**Trigger phrases**:
- "DS" (dev-story)
- "Dev story"
- "Execute story"
- "Run story"
- "Create story"
- "Sprint planning"

**Skills loaded**: bmad-bmm:workflows:dev-story, bmad-bmm:workflows:sprint-planning

### BMad Framework Skills (Auto-Load)
**Trigger phrases**:
- "Create epic"
- "Create PRD"
- "Create architecture"
- "Create tech spec"
- "Code review"
- "Retrospective"

**Skills loaded**: bmad-bmm:workflows:create-*, bmad-bmm:workflows:code-review

---

## Core Architecture
- **Multi-tenant**: PostgreSQL schema-based isolation (`tenant_*` schemas)
- **Component hierarchy**: Site → Zone → Component (atom/molecule/organism)
- **Hybrid API**: tRPC (type-safe) + REST (AI agent compatible)
- **AI-First**: OpenAI integration for vision, content generation

## Quick Commands

```bash
# Root level (all workspaces)
npm run build          # Build all packages and apps
npm run dev            # Start all dev servers in parallel
npm run lint           # Lint all workspaces
npm run test           # Run all tests

# API (apps/api) - Backend on port 4000
cd apps/api && npm run dev           # tsx watch with hot reload
cd apps/api && npm run build         # TypeScript to dist/
cd apps/api && npm run test          # Vitest tests

# Dashboard (apps/dashboard) - React/Vite admin UI
cd apps/dashboard && npm run dev     # Vite dev server
cd apps/dashboard && npm run build   # Production build
cd apps/dashboard && npm run test    # Vitest unit tests

# Marketing Site (apps/marketing-site) - React/Vite
cd apps/marketing-site && npm run dev
cd apps/marketing-site && npm run build
```

### n8n Workflow Management (via n8n-manager skill)

```
Import workflow: "Import {filename}.json into n8n"
List workflows: "List all n8n workflows"
Activate workflow: "Activate {workflow name}"
Get webhook URL: "Get webhook URL for {workflow}"
Export workflows: "Export all n8n workflows"
```

**Manual n8n CLI** (if needed):
```bash
docker exec n8n n8n list:workflow                                    # List workflows
docker exec n8n n8n import:workflow --input=/home/node/.n8n/{file}.json --projectId=DoUXPTmX5jiPGzyG  # Import
docker exec n8n n8n export:workflow --all --output=/home/node/.n8n/backup.json  # Export all
```

## Project Structure

### Apps (`apps/`)

| App | Tech Stack | Purpose |
|-----|-----------|---------|
| `api` | Node.js/Express, tRPC | Backend server (port 4000) |
| `dashboard` | React 18, Vite 6, Tailwind, Radix UI | Admin interface |
| `marketing-site` | React 19, Vite 7, Tailwind 4 | Public marketing page |

### Packages (`packages/`)

| Package | Purpose |
|---------|---------|
| `@codename/api` | Zod schemas & TypeScript types |
| `@codename/database` | PostgreSQL connection pooling, multi-tenant schemas |
| `@znapsite/design-system` | Shared React components |

## Key Services

### API (`apps/api/src/`)
- `services/tenant/` - Multi-tenant database operations, container provisioning
- `services/admin/` - Billing, aggregation, theme generation, Instagram sync
- `services/booking/` - Availability, payment, notifications
- `services/vision.service.ts` - AI image extraction (OpenAI/Claude/Gemini)
- `services/provision.service.ts` - n8n webhook orchestration
- `services/integration.service.ts` - Social media connections
- `routers/` - tRPC routers (admin, booking, marketing, provision, site)
- `routes/component.rest.router.ts` - REST endpoints for AI agents

### Dashboard Features
- `features/onboarding/` - Theatrical reveal flow, Smart Ledger service editor
- `features/design-studio/` - Theme editor with real-time CSS generation
- `features/admin/` - Main dashboard with analytics, components management
- `features/booking/` - Booking system UI

## Architecture Patterns

### Multi-Tenancy
```typescript
// Each tenant gets isolated schema: tenant_{id}
query('tenant_123', 'SELECT * FROM sites WHERE tenant_id = $1', ['123'])
```

### Component System
```
Site (domain)
  └── Zone (page section)
      └── Component (atom/molecule/organism)
          ├── style: Variant config
          ├── animation: Motion settings
          └── integration: External data source
```

### API Communication
- **Dashboard → API**: tRPC with `@trpc/react-query`
- **Agents → API**: REST at `/api/*` with JSON responses
- **tRPC Router**: `src/router.ts`, mounted at `/trpc`

## Environment Variables

Required (see `.env.example`):

| Category | Variables |
|----------|-----------|
| **Database** | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| **AI Services** | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` or `GOOGLE_AI_API_KEY` |
| **Orchestration** | `N8N_WEBHOOK_URL`, `N8N_API_KEY` |
| **Infrastructure** | `REPLIT_API_KEY`, `CLOUDFLARE_API_TOKEN` |
| **Payments** | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| **Feature Flags** | `FEATURE_VISION_AI_ENABLED`, `FEATURE_DESIGN_STUDIO_ENABLED` |

## Development Notes

### Path Aliases
- `@dashboard/*` → `apps/dashboard/src/*`

### Package Management
- npm@10.0.0 with workspaces
- Internal deps use `*` version: `"@codename/database": "*"`
- Turbo handles workspace resolution

### Build Outputs
- `api`: `dist/` from TypeScript compilation
- `dashboard`: Vite build to `dist/`
- `packages`: `dist/` consumed by apps

### Testing
- **Unit**: Vitest with jsdom (React Testing Library)
- **API**: Co-located `.test.ts` files
- **Run specific**: `cd apps/dashboard && npm run test -- path/to/test.test.ts`

## Key Design Decisions

1. **Vision AI First** - Image extraction core to onboarding flow
2. **WebAuthn Primary** - Passkeys with zk-SNARK fallback
3. **Container Orchestration** - n8n webhooks trigger Replit provisioning
4. **Cost Monitoring** - Billing service tracks usage per tenant
5. **Instagram Sync** - Background service mirrors content to components
6. **Theme as CSS** - Design studio compiles to CSS variables for performance

---

## 📚 Critical Knowledge Base References

**Database & Schema**:
- Sites table uses `tenant_id` NOT `owner_id`
- Connection pooler: `aws-1-us-east-2.pooler.supabase.com:6543`
- See: `supabase-migrations` skill for credentials

**n8n Workflow Warnings**:
- Connection structure: 2D array `[[{...}]]` NOT 3D `[[[{...}]]]`
- Project ID: `DoUXPTmX5jiPGzyG`
- See: `n8n-manager` skill for complete issues list

**For complete reference**: `/home/dev/.claude/skills/codename-database-knowledge-base.md`
