# Znapsite Product Discovery

**Project:** Znapsite Template System  
**Date:** 2026-01-08 (Updated)  
**Status:** Homepage IMPLEMENTED, Templates in Progress

---

## Document Index

| Document | Purpose | Key Content |
|----------|---------|-------------|
| [Discovery Notes](./znapsite-template-system-discovery.md) | Initial product vision | Core concept, reference models, key decisions |
| [Layout Templates](./layout-templates-spec.md) | Template specifications | 6 templates, 5 navbar styles, zone definitions, grid rules |
| [Component Library](./component-library-spec.md) | Design system | Atomic structure, typography tokens, animation tokens, marketplace architecture |
| [Homepage Design](./znapsite-homepage-design.md) | Znapsite.com homepage | Tool-first onboarding, Tesla coil lightning, zone-by-zone spec |
| [Free Component Catalog](./free-component-catalog.md) | Available components | 61 free components from Aceternity/Magic UI |
| [Course Correction](../../../.agent/workflows/bmad/znapsite-frontend-course-correction.md) | UX decision rationale | Why tool-first over signup funnel |

---

## Quick Reference

### Core Concept
**"Structured Freedom"** — Users customize design (colors, fonts, content) while we control structure (zones, grids, atomic design).

### Homepage Architecture (IMPLEMENTED)
**Tool-First Onboarding** — Users build before signing up
- Tesla coil lightning background (pink pixel art)
- Three input modes: ✨ Design | 🔗 Link | 📎 Upload
- Account creation at step 6 (after preview)
- Live at: https://znapsite.com

### Technology Stack (Animation)
- **Framer Motion** — Animation engine
- **Aceternity UI + Magic UI** — Component style sources
- **CSS Custom Properties** — Design token system
- **HTML Canvas 2D** — Tesla coil lightning

### Templates (6)
1. The Starter — Launch & Grow
2. The Creative — Show Your Work
3. The Pro — Get Booked
4. The Builder — Sell Your Product
5. The Personal — Be Known
6. The Shop — Sell Stuff

### Navbar Styles (5)
Clean, Bold, Floating, Split, Minimal

### Free Components
61 total across 12 categories (see [catalog](./free-component-catalog.md))

---

## Implementation Sequence

1. ✅ Define layout templates
2. ✅ Define component library + tokens
3. ✅ Design znapsite.com homepage
4. ✅ Curate free component catalog
5. ✅ Implement Tesla coil lightning background (COMPLETED 2026-01-08)
6. ✅ Build tool-first onboarding flow (COMPLETED 2026-01-08)
7. ⬜ Build component wrapper layer
8. ⬜ Create template builder UI
9. ⬜ Implement remaining onboarding steps (2-7)

---

## Session Continuity

When resuming work, read documents in this order:
1. This README (overview)
2. Discovery Notes (vision context)
3. Homepage Design (implemented reference)
4. Relevant spec document for current task
