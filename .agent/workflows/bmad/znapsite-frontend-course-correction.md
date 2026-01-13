# Course Correction: znapsite.com Homepage UX Flow

**Date:** 2026-01-08
**Triggered By:** Product Owner (Dev)
**Workflow:** correct-course (Incremental Mode)
**Status:** ✅ COMPLETED

---

## Executive Summary

The znapsite.com homepage was implemented as a SaaS marketing landing page with a signup funnel. The original architecture specifies a **tool-first onboarding experience** where users can immediately use the tool without creating an account. This course correction restructured the homepage from a signup funnel to a value-first onboarding flow.

**Key Change:** Account creation moves from step 1 → step 6 (AFTER user previews their site)

**Resolution:** All changes implemented and live as of 2026-01-08

---

## What Was Implemented

### Hero Section (COMPLETED)
| Feature | Status | Description |
|---------|--------|-------------|
| Logo with glowing Z | ✅ Done | SVG filter with pink glow (#d552b7) |
| "Describe Your Website" headline | ✅ Done | Above input, text-4xl md:text-5xl |
| Subheadline | ✅ Done | "Tell us what you need. AI will build it for you." |
| Tab-based input modes | ✅ Done | ✨ Design | 🔗 Link | 📎 Upload |
| Glass card styling | ✅ Done | No glow effects (per user request) |
| Trust badges (3x larger) | ✅ Done | text-lg with 28px icons |

### Background Animation (COMPLETED)
| Feature | Status | Description |
|---------|--------|-------------|
| Tesla coil lightning | ✅ Done | Replaced pixel hourglass |
| Pixel art aesthetic | ✅ Done | 6x6px pink pixels |
| Fast timing | ✅ Done | 50-150ms spawn, 80-200ms lifetime |
| Branching algorithm | ✅ Done | 25% branch probability |

### Layout Order (COMPLETED)
1. Logo (h-48 md:h-60)
2. "Describe Your Website" headline
3. Subheadline
4. Input area (mode-specific)
5. Tab selector
6. Trust badges

---

## Problem Statement (Original)

| Field | Value |
|-------|-------|
| **Issue Type** | UX Flow Mismatch - Architecture Deviation |
| **Severity** | High - Fundamental product experience |
| **Current Epic** | Epic 7: Glassmorphism Marketing Site Redesign |
| **Target Epic** | Epic 1: The Zero-Touch Factory (Core Provisioning) |

**What Was Built (Wrong):**
- SaaS landing page with "Start Free" buttons
- Pricing tiers displayed upfront (old model: $0/$19/$49; new model: Free/Standard $39/AI $79 with auto-calculation)
- Email capture before tool access
- Signup funnel → Account → Dashboard

**Note (2026-01-11):** The pricing model was subsequently redesigned to use auto-calculation based on component selections, rather than upfront plan selection. Users no longer choose plans directly; the system infers Free/Standard/AI-Powered based on their feature selections.

**What Was Intended (Correct):**
- Tool-first onboarding with immediate entry
- Upload → Extract → Preview → (THEN) Customer Info → Deploy
- Account creation AFTER seeing value

---

## Implementation Results

### Files Created
- `apps/marketing-site/src/components/backgrounds/PixelLightning.tsx` - Tesla coil animation
- `apps/marketing-site/public/banner-logo.svg` - Logo with glowing Z
- `apps/marketing-site/public/logo-icon.svg` - Favicon
- `apps/marketing-site/public/logo.png` - Open graph image

### Files Modified
- `apps/marketing-site/src/App.tsx` - Tool-first onboarding flow
- `apps/marketing-site/src/index.css` - Updated glassmorphism (no glows)
- `apps/marketing-site/index.html` - Meta tags and open graph

### Deployment
- **URL:** https://znapsite.com
- **Status:** Live
- **Proxy:** Caddy → localhost:8080 (vite preview)

---

## Remaining Work

| Phase | Task | Status |
|-------|------|--------|
| Phase 1 | Documentation updates | ✅ Done (this file) |
| Phase 2 | ComponentPicker.tsx | ✅ Done |
| Phase 2 | CustomerInfoForm.tsx | ✅ Done |
| Phase 2 | WireframeSelector.tsx | ✅ Done |
| Phase 2 | OnboardingProgress.tsx | ✅ Done |
| Phase 3 | Step routing logic | ✅ Done |
| Phase 3 | n8n deployment integration | ⏳ Pending (backend work) |

---

## Sign-Off

| Role | Name | Decision |
|------|------|----------|
| Product Owner | Dev | ✅ APPROVED |
| PM Agent | Claude | ✅ COMPLETED |

**Completion Date:** 2026-01-08
