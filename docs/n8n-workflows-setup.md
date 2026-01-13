# n8n Workflows - AI Builder Agent Setup Guide

This guide explains how to set up and use the n8n workflows for the znapsite AI Builder Agent system.

---

## Overview

The AI Builder Agent uses **3 n8n workflows** to orchestrate AI-powered website generation:

1. **GLM Vision Extraction** - Extracts business data from images (logos, photos, price lists)
2. **Local Builder Code Generation** - Generates React component code using Local LLM
3. **Theme Apply Workflow** - Applies published theme CSS to tenant containers

These workflows integrate with the znapsite API to provide AI-powered website creation.

---

## Workflow Files

| File | Purpose | Endpoints |
|------|---------|-----------|
| `glm-vision-extraction.json` | Single image extraction | `POST /webhook/glm-vision-extract` |
| `glm-vision-batch-extraction.json` | Batch image processing | `POST /webhook/glm-vision-batch` |
| `local-builder-codegen.json` | Code generation | `POST /webhook/local-builder-generate` |
| `theme-apply-workflow.json` | Theme CSS deployment | `POST /webhook/theme-apply` |

---

## Installation Steps

### 1. Access n8n Dashboard

Navigate to your self-hosted n8n instance:
```
https://n8n.b2ainvestments.com
```

### 2. Import Workflows

**Automated Import (Recommended):**

Use the `n8n-manager` skill to import workflows automatically:

```
User: "Import theme-apply-workflow.json into n8n"
→ Skill validates JSON, runs import command, returns workflow ID
```

**Manual Import (UI):**

For each workflow file:

1. Click **"Import from File"** in n8n
2. Select the JSON file from `/opt/docker-stack/n8n-data/workflow_backups/`
3. Review the workflow structure
4. Click **"Save"** to import

Import in this order:
1. `glm-vision-extraction.json` (base workflow)
2. `glm-vision-batch-extraction.json` (depends on base)
3. `local-builder-codegen.json` (standalone)
4. `theme-apply-workflow.json` (orchestration)

### 3. Configure Credentials

#### PostgreSQL Database Credentials

1. Go to **Credentials** → **New Credential**
2. Select **PostgreSQL** database connection
3. Configure:
   - **Name**: `codename Database`
   - **Host**: Database host (from `DATABASE_URL`)
   - **Database**: Database name from connection string
   - **User**: Database user from connection string
   - **Password**: Database password from connection string
   - **Port**: 5432 (default PostgreSQL port)
4. Test connection and save

#### GLM Vision API Credentials

1. Go to **Credentials** → **New Credential**
2. Select **Header Auth** (HTTP Header Authentication)
3. Configure:
   - **Name**: `GLM Vision API`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer 925681ae2cad426c83200f7feb9c09d9.FmZFDuJYggRuVWW5`
4. Save and note the credential ID

#### Update Workflow Credential References

In the imported workflows, find the **"Call GLM Vision API"** node and:
1. Click the node
2. Under **Credentials**, select `GLM Vision API`
3. Save the workflow

### 4. Activate Webhooks

For each workflow with a Webhook node:

1. Click the **Webhook** node
2. Under **Webhook URL**, note the production URL
3. Click **"Listen for Test Event"** (for testing)
4. Or click **"Activate"** to make it production-ready

**Production Webhook URLs** (replace `n8n.b2ainvestments.com` with your domain):
- GLM Vision: `https://n8n.b2ainvestments.com/webhook/glm-vision-extract`
- Batch: `https://n8n.b2ainvestments.com/webhook/glm-vision-batch`
- Code Gen: `https://n8n.b2ainvestments.com/webhook/local-builder-generate`
- Theme Apply: `https://n8n.b2ainvestments.com/webhook/theme-apply`

### 5. Activate Workflows

**Automated Activation (Recommended):**

Use the `n8n-manager` skill to activate workflows:

```
User: "Activate the theme-apply workflow"
→ Skill finds workflow by name, activates it, returns status
```

**Manual Activation (UI):**

For each workflow:
1. Click **"Active"** toggle in the top right
2. The workflow status should change to **Active**

---

## Automation with n8n-manager Skill

The `n8n-manager` skill automates common n8n workflow operations, eliminating the need for manual CLI and UI interactions.

### Available Operations

| Operation | Command | Example |
|-----------|---------|---------|
| Import workflow | "Import {filename}.json into n8n" | Import theme-apply-workflow.json |
| List workflows | "List all n8n workflows" | Show workflow IDs and names |
| Activate workflow | "Activate {workflow name}" | Enable workflow execution |
| Deactivate workflow | "Deactivate {workflow name}" | Disable workflow execution |
| Get webhook URL | "Get webhook URL for {workflow}" | Returns full webhook URL |
| Export workflows | "Export all n8n workflows" | Backup to JSON file |

### When to Use n8n-manager

- **Importing workflows** - Validates JSON and runs import command
- **Bulk activation** - Activate multiple workflows at once
- **Getting webhook URLs** - Quickly retrieve webhook paths
- **Export/backup** - Create workflow backups
- **Listing workflows** - Get all workflow IDs and names

### Related Skills

- `n8n-mcp-tools-expert` - Create and edit workflows
- `n8n-workflow-patterns` - Architectural patterns
- `n8n-code-javascript` - Write JavaScript code nodes
- `n8n-validation-expert` - Debug workflow errors

---

## Workflow Details

### GLM Vision Extraction Workflow

**Purpose**: Extract business information from a single image

**Input**:
```json
{
  "imageUrl": "https://example.com/logo.png",
  "extractionType": "logo"  // logo, photo, or priceList
}
```

**Output**:
```json
{
  "success": true,
  "extractionId": "logo-uuid",
  "type": "logo",
  "data": {
    "businessName": "My Business",
    "colors": ["#FF5733", "#C70039", "#900C3F"],
    "businessType": "salon",
    "vibe": "modern professional"
  },
  "confidence": 85,
  "warnings": [],
  "processingTimeMs": 2500
}
```

**Nodes**:
1. **GLM Vision Webhook** - Receives POST requests
2. **Validate Input** - Checks extraction type is valid
3. **Build System Prompt** - Creates GLM-specific prompt based on type
4. **Call GLM Vision API** - Calls Zhipu AI GLM-4V-Plus API
5. **Parse GLM Response** - Extracts and validates JSON response
6. **Success Response** - Returns extracted data
7. **Error Response** - Returns validation errors

---

### GLM Vision Batch Extraction Workflow

**Purpose**: Process multiple images and aggregate business context

**Input**:
```json
{
  "images": [
    { "url": "https://example.com/logo.png", "type": "logo" },
    { "url": "https://example.com/interior.jpg", "type": "photo" },
    { "url": "https://example.com/pricelist.png", "type": "priceList" }
  ]
}
```

**Output**:
```json
{
  "success": true,
  "businessContext": {
    "businessName": "My Business",
    "businessType": "salon",
    "colors": ["#FF5733", "#C70039", "#900C3F"],
    "vibe": "modern professional",
    "services": [
      { "name": "Haircut", "price": 5000, "duration": 60 },
      { "name": "Color", "price": 12000, "duration": 120 }
    ],
    "confidence": 82,
    "warnings": [],
    "extractionCount": 3,
    "processingTimeMs": 7500
  },
  "extractionCount": 3,
  "batchId": "uuid",
  "timestamp": "2025-01-12T10:30:00Z"
}
```

**Nodes**:
1. **Batch Webhook** - Receives POST requests with images array
2. **Validate Input** - Checks images array is valid
3. **Split into Batches** - Processes 3 images at a time
4. **Prepare Requests** - Formats individual extraction requests
5. **Call Single Extraction** - Calls the base GLM Vision workflow
6. **Merge Batch Results** - Combines batch results
7. **Check More Batches?** - Loops until all images processed
8. **Aggregate Business Context** - Combines all data into unified context
9. **Success Response** - Returns aggregated business context

---

### Local Builder Code Generation Workflow

**Purpose**: Generate React component code from design specifications

**Input**:
```json
{
  "designSpecId": "uuid",
  "componentTree": {
    "zones": [
      {
        "zoneType": "header",
        "position": 1,
        "components": [
          {
            "componentId": "navigation-bar",
            "props": {
              "logo": "/logo.png",
              "links": ["Home", "Services", "Contact"]
            }
          }
        ]
      }
    ]
  },
  "themeConfig": {
    "colors": {
      "primary": "#FF5733",
      "secondary": "#C70039",
      "accent": "#900C3F"
    },
    "typography": {
      "heading": "Inter",
      "body": "Open Sans"
    }
  }
}
```

**Output**:
```json
{
  "success": true,
  "designSpecId": "uuid",
  "generatedCode": {
    "components": {
      "navigation-bar": {
        "componentName": "NavigationBar",
        "code": "import React from 'react';\nimport { motion } from 'framer-motion';\n\ninterface NavigationBarProps {\n  logo: string;\n  links: string[];\n}\n\nexport default function NavigationBar(props: NavigationBarProps) {\n  return (\n    <motion.nav className=\"flex justify-between items-center p-4\">\n      <img src={props.logo} alt=\"Logo\" />\n      <ul className=\"flex gap-4\">\n        {props.links.map(link => (\n          <li key={link}>{link}</li>\n        ))}\n      </ul>\n    </motion.nav>\n  );\n}",
        "zoneType": "header"
      }
    },
    "metadata": {
      "designSpecId": "uuid",
      "componentCount": 1,
      "generatedAt": "2025-01-12T10:30:00Z",
      "totalProcessingTimeMs": 15000,
      "successCount": 1,
      "fallbackCount": 0,
      "avgProcessingTimeMs": 15000
    }
  },
  "warnings": [],
  "timestamp": "2025-01-12T10:30:00Z"
}
```

**Nodes**:
1. **Code Gen Webhook** - Receives POST requests with design spec
2. **Validate Input** - Checks designSpecId and componentTree
3. **Extract Components** - Flattens component tree into individual items
4. **Build Code Prompt** - Creates Llama-4-Scot prompts for each component
5. **Call Local LLM** - Calls local Ollama/vLLM endpoint
6. **Parse LLM Response** - Extracts and cleans generated code
7. **Merge Component Results** - Combines all component results
8. **Aggregate Generated Code** - Builds final code bundle
9. **Success Response** - Returns generated code package

---

### Theme Apply Workflow

**Purpose**: Applies published theme CSS to tenant containers via Replit API

**Input**:
```json
{
  "event": "THEME_PUBLISHED",
  "payload": {
    "tenantId": "tenant_abc123",
    "css": "/* Generated by Design Studio */\n:root {\n  --background-primary: oklch(1 0 0);\n  --text-primary: oklch(0.2156 0 0);\n}\n\n.dark {\n  --background-primary: oklch(0.2156 0 0);\n  --text-primary: oklch(1 0 0);\n}",
    "version": 5,
    "styles": {
      "light": { "background-primary": "#ffffff" },
      "dark": { "background-primary": "#000000" }
    },
    "hslAdjustments": {
      "hueShift": 0,
      "saturationScale": 1,
      "lightnessScale": 1
    },
    "generatedAt": "2026-01-13T06:30:00Z"
  }
}
```

**Output**:
```json
{
  "success": true,
  "message": "Theme CSS deployed successfully",
  "tenantId": "tenant_abc123",
  "domainName": "example.codename.app",
  "themeVersion": 5,
  "cssLength": 245,
  "deployedAt": "2026-01-13T06:30:05Z",
  "timestamp": "2026-01-13T06:30:05Z"
}
```

**Error Output**:
```json
{
  "success": false,
  "error": "Tenant container not found or inactive",
  "tenantId": "tenant_abc123",
  "statusCode": 404,
  "timestamp": "2026-01-13T06:30:00Z"
}
```

**Nodes**:
1. **Theme Published Webhook** - Receives POST requests from ThemeService
2. **Validate Webhook Payload** - Checks event type, tenantId, and CSS presence
3. **Extract Theme Data** - Parses theme data from webhook payload
4. **Get Tenant Container Info** - Queries database for Replit container details
5. **Check Tenant Container Exists** - Validates tenant has active container
6. **Build Replit API Request** - Constructs Replit file write request
7. **Update theme.css in Container** - Calls Replit API to update CSS file
8. **Log Deployment Success** - Records successful deployment for audit trail
9. **Handle API Error** - Gracefully handles Replit API failures

**Database Query**:
```sql
SELECT
  id, tenant_id, container_url, container_id,
  api_token, domain_name, status
FROM public.tenants
WHERE tenant_id = '{{ $json.tenantId }}'
  AND status = 'active'
LIMIT 1;
```

**Replit API Integration**:
- **Endpoint**: `{container_url}/files/theme.css`
- **Method**: POST
- **Headers**:
  - `Authorization`: `Bearer {api_token}`
  - `Content-Type`: `application/json`
  - `X-Replit-Container-Id`: `{container_id}`
- **Body**:
  ```json
  {
    "filePath": "theme.css",
    "content": "{generated_css}",
    "message": "Update theme CSS to version {version}"
  }
  ```

---

## Environment Configuration

### Local LLM Setup

The Local Builder workflow expects a local LLM running at `http://localhost:11434` (Ollama default).

**Install Ollama** (on the same server as n8n):
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull Llama-4-Scout model (or use another model)
ollama pull llama-4-scout:17b-q4

# Start Ollama server
ollama serve
```

**Update Local LLM URL** if different:
1. Open `local-builder-codegen.json` workflow
2. Find the **"Call Local LLM"** node
3. Update the URL to your Ollama/vLLM endpoint

### GLM API Key

The GLM Vision API key is already configured in the workflows:
```
API Key: 925681ae2cad426c83200f7feb9c09d9.FmZFDuJYggRuVWW5
API Base: https://open.bigmodel.cn/api/paas/v4/
Model: glm-4v-plus
```

---

## Integration with znapsite API

The Agent REST API router (`/api/v1/agent`) and ThemeService call these n8n workflows:

```typescript
// apps/api/src/routes/agent.rest.router.ts

// Single extraction
await fetch(`${N8N_WEBHOOK_URL}/glm-vision-extract`, {
  method: 'POST',
  body: JSON.stringify({ imageUrl, extractionType })
});

// Batch extraction
await fetch(`${N8N_WEBHOOK_URL}/glm-vision-batch`, {
  method: 'POST',
  body: JSON.stringify({ images })
});

// Code generation
await fetch(`${N8N_WEBHOOK_URL}/local-builder-generate`, {
  method: 'POST',
  body: JSON.stringify({ designSpecId, componentTree, themeConfig })
});

// apps/api/src/services/admin/theme.service.ts

// Theme apply orchestration (called by ThemeService.publishTheme)
await fetch(`${N8N_WEBHOOK_URL}/theme-apply`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.ORCHESTRATION_SECRET && {
      'X-BMAD-SECRET': process.env.ORCHESTRATION_SECRET
    })
  },
  body: JSON.stringify({
    event: 'THEME_PUBLISHED',
    payload: {
      tenantId,
      css: generatedCSS,
      version: themeVersion,
      styles,
      hslAdjustments,
      generatedAt: new Date().toISOString()
    }
  })
});
```

Update `.env` with your n8n webhook base URL:
```bash
N8N_WEBHOOK_URL=https://n8n.b2ainvestments.com/webhook
ORCHESTRATION_SECRET=your-secret-key
```

---

## Testing Workflows

### Test GLM Vision Extraction

```bash
curl -X POST https://n8n.b2ainvestments.com/webhook/glm-vision-extract \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/logo.png",
    "extractionType": "logo"
  }'
```

### Test Batch Extraction

```bash
curl -X POST https://n8n.b2ainvestments.com/webhook/glm-vision-batch \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      { "url": "https://example.com/logo.png", "type": "logo" },
      { "url": "https://example.com/interior.jpg", "type": "photo" }
    ]
  }'
```

### Test Code Generation

```bash
curl -X POST https://n8n.b2ainvestments.com/webhook/local-builder-generate \
  -H "Content-Type: application/json" \
  -d '{
    "designSpecId": "test-uuid",
    "componentTree": {
      "zones": [{
        "zoneType": "header",
        "position": 1,
        "components": [{
          "componentId": "hero-section",
          "props": { "title": "Welcome" }
        }]
      }]
    },
    "themeConfig": {
      "colors": { "primary": "#FF5733" }
    }
  }'
```

### Test Theme Apply Workflow

```bash
curl -X POST https://n8n.b2ainvestments.com/webhook/theme-apply \
  -H "Content-Type: application/json" \
  -d '{
    "event": "THEME_PUBLISHED",
    "payload": {
      "tenantId": "tenant_test",
      "css": "/* Test CSS */\n:root {\n  --test: value;\n}",
      "version": 1,
      "styles": {
        "light": {},
        "dark": {}
      },
      "hslAdjustments": {
        "hueShift": 0,
        "saturationScale": 1,
        "lightnessScale": 1
      },
      "generatedAt": "2026-01-13T06:30:00Z"
    }
  }'
```

---

## Troubleshooting

### Workflow Not Executing

1. Use `n8n-manager` to check workflow status: "List all n8n workflows"
2. Verify webhook URL is correct: "Get webhook URL for {workflow name}"
3. Activate workflow if needed: "Activate {workflow name}"
4. Check n8n execution logs in dashboard

### GLM API Errors

1. Verify API key is correct
2. Check GLM API status: https://open.bigmodel.cn/
3. Review API rate limits

### Local LLM Not Responding

1. Check Ollama is running: `curl http://localhost:11434/api/tags`
2. Verify model is downloaded: `ollama list`
3. Check firewall rules allow localhost access

### Timeout Errors

1. GLM Vision timeout: 120 seconds (configurable in HTTP Request node)
2. Local LLM timeout: 120 seconds (configurable in HTTP Request node)
3. Batch size: Reduce from 3 to 2 if experiencing timeouts
4. Theme Apply timeout: 30 seconds (Replit API call - configure in HTTP Request node)

### Theme Apply Workflow Errors

1. **Tenant Not Found**: Verify tenant exists in `public.tenants` table with `status='active'`
2. **Replit API Timeout**: Check Replit container is running and accessible
3. **Invalid CSS**: ThemeService should validate CSS before sending to n8n
4. **Database Connection**: Verify PostgreSQL credentials are correct
5. **API Token Error**: Ensure `api_token` in tenants table is valid for Replit

### n8n 2.2.6 Known Bug: Cannot Publish Imported Workflows

**Problem**: n8n Community Edition 2.2.6 (and 2.3.1) has a bug where imported workflows cannot be published. Error: "Workflow could not be published: Version not found" or "You don't have permission to publish this workflow."

**Workaround**:
1. Import the workflow
2. Open the workflow in the n8n editor
3. Make a dummy edit (add/remove a tag, or drag any node slightly)
4. Save the workflow
5. Then publish - it should work

**Root Cause**: This is a known bug in n8n Community Edition. See:
- [n8n Community #248302](https://community.n8n.io/t/cannot-publish-new-workflows-in-community-version/248302)
- [GitHub Issue #22393](https://github.com/n8n-io/n8n/issues/22393)

**Alternative Solution**: Downgrade to n8n 2.1.x if this becomes a persistent blocker.

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ZNAPSITE DASHBOARD                       │
│                   (User uploads images)                     │
│                  (User publishes theme)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│                   ZNAPSITE API (tRPC/REST)                  │
│           /api/v1/agent/* | ThemeService.publishTheme       │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬───────────────┐
         │               │               │               │
         v               v               v               v
┌────────────────┐ ┌──────────────┐ ┌──────────────────┐ ┌─────────────┐
│  GLM Vision    │ │  GLM Batch   │ │  Local Builder   │ │   Theme     │
│  Extraction    │ │  Extraction  │ │  Code Gen        │ │   Apply     │
│                │ │              │ │                  │ │             │
│ - Single image │ │ - Multiple   │ │ - React code     │ │ - CSS to    │
│ - Logo analysis│ │   images     │ │ - TypeScript     │ │   Replit    │
│ - Photo scan   │ │ - Aggregation│ │ - Tailwind       │ │ - Container │
│ - Price list   │ │              │ │ - Framer Motion  │ │   update    │
└────────────────┘ └──────────────┘ └──────────────────┘ └─────────────┘
         │               │               │               │
         v               v               v               v
┌─────────────────────────────────────────────────────────────────────┐
│              DESIGN SPEC & THEME (agent_design_specs)               │
│              - componentTree JSON                                   │
│              - themeConfig JSON                                     │
│              - generatedCode JSON                                   │
│              - theme.css (generated)                                │
└─────────────────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         v                               v
┌─────────────────────────────────────────────────────────────┐
│                  ZNAPSITE MULTI-TENANT DB                   │
│              - tenant_{id} schema isolation                 │
└─────────────────────────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│                 TENANT CONTAINERS (Replit)                   │
│              - Each tenant gets isolated container           │
│              - theme.css updated by n8n workflow             │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

After workflows are set up:

1. **Test each workflow** individually with sample data
2. **Configure the znapsite API** to call n8n webhooks
3. **Run database migrations** for agent tables
4. **Test the full flow**: Dashboard → API → n8n → GLM Vision → Local Builder → DB
5. **Monitor execution logs** in n8n dashboard

See **Phase 1 Implementation** in the AI Builder Agent tech spec for full integration steps.
