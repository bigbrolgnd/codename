# Znapsite Template System - Product Discovery Notes

**Date:** 2026-01-08 (Updated)
**Session:** PM Agent Chat with Dev

---

## Core Vision

**Concept:** Business OS with structured customization freedom  
**Tagline idea:** "Structured freedom" — users feel creative but can't break the layout

### Reference Models
- **Obsidian Publish** — sites look different but *feel* the same
- **MySpace** — same layout structure, design varies
- **Figma wireframe menu** — layout presets, not design themes

---

## Key Product Decisions

### 1. Templates = Layout Wireframes (Not Designs)

Templates define **structural decisions**:
- Hero position (above/below nav, full-bleed, split)
- Content alignment defaults (left/center/right)
- Section stacking order
- Grid behavior for component zones

The *design* (colors, typography, imagery) = user content  
The *structure* = our system (the "patented design structure")

### 2. Proposed Template Categories (By Use Case)

| Template | Primary Use | Key Sections |
|----------|------------|--------------|
| **Landing Page** | Lead gen | Hero + Features + CTA |
| **Portfolio/Showcase** | Creatives | Gallery-forward, minimal text |
| **Service Business** | Local/agencies | Trust signals, testimonials, booking |
| **SaaS/Product** | Tech products | Feature sections, pricing, docs |
| **Personal Brand** | Creators/consultants | Bio-forward, social links, content |
| **E-commerce Lite** | Small shops | Product grid, cart CTA, categories |

> **Note:** Exact count TBD based on target user segments

### 3. Grid-Locked Drag-and-Drop System

**Constraint model:** Block-based page builder with:
- **Rectangles** — full-width sections
- **Half-squares** — 2-column zones
- **Quarter-blocks** — tighter grids (potential)

**Open question:** Semantic zones (header/body/footer) vs. purely spatial (row 1, row 2)?  
→ Semantic zones help AI automations: "put testimonials in trust zone"

---

## Znapsite.com Homepage Direction

**Template choice:** Hero + Input tabs (tool-first onboarding)

**Brand message:** "Describe your website. AI builds it in seconds."

### Visual Direction (UPDATED 2026-01-08)
- **Background:** Black → Pink Tesla coil pixel lightning
- **Concept:** Two tesla coils at bottom corners shoot branching pixel electricity across screen
- **Metaphor:** AI power, speed, automation — instant results
- **Vibe:** Electric, fast, mesmerizing, not corporate sterile

### Tesla Coil Lightning Specs
- **Position:** Bottom-left and bottom-right corners
- **Coil design:** Stacked pixel spheres (6x6px) with glowing tops
- **Lightning:** Pink pixel-art bolts with jagged branching
- **Speed:** Very fast — spawn every 50-150ms, last 80-200ms
- **Branching:** 25% chance per segment, 3-5 branch segments
- **Effect:** Flickering + occasional spark pixels

### Why Lightning (Not Hourglass)
- Faster, more energetic feel
- Better communicates "AI speed" 
- Tesla coils = power/automation metaphor
- Pixel art aesthetic = playful, on-brand
- Electrical branching = AI "thinking" visualization

### Technical Approach
- HTML Canvas 2D (not Three.js)
- Recursive branching algorithm for lightning paths
- Respects `prefers-reduced-motion`

---

## Tool-First Onboarding (NEW 2026-01-08)

The homepage is NOT a traditional SaaS landing page. It's direct tool entry:

| Step | Screen | Account Required? |
|------|--------|-------------------|
| 1 | **Hero Input** (Design/Link/Upload) | ❌ No |
| 2 | **Business Details** | ❌ No |
| 3 | **Wireframe Selection** | ❌ No |
| 4 | **Component Picker** | ❌ No |
| 5 | **Preview** | ❌ No |
| 6 | **Customer Info** | ⚠️ NOW |
| 7 | **Launch** | ✅ Yes |

**Key Principle:** Users see value BEFORE being asked to create an account.

---

## Hero Input Modes

Users have three ways to start:

| Mode | Input | Use Case |
|------|-------|----------|
| **Design** ✨ | Text description | "A landing page for my beauty salon" |
| **Link** 🔗 | URL/Instagram/TikTok | "Paste your existing website..." |
| **Upload** 📎 | File dropzone | "Drag your price list or menu..." |

All three paths lead to the same AI generation flow — just different input sources.

---

## Atomic Design Structure

**Framework:** Atoms → Molecules → Organisms → Templates → Pages

**Our differentiation:** Not the concept (Brad Frost), but our **implementation conventions**:
- How our atoms compose
- Naming patterns
- Variant systems
- Grid behavior rules

**Validation test:** Can we build 5+ visually distinct sites from the same component library?

---

## Next Steps (Sequence)

1. ~~Define layout templates~~ — wireframe-level specifications for each use case
2. ~~Define component library~~ — what molecules/organisms exist, their grid behaviors
3. ~~Design znapsite.com homepage~~ — using template #1 as proof-of-concept
4. ✅ **Implement Tesla coil lightning** — standalone showcase (COMPLETED 2026-01-08)
5. ~~Build remaining onboarding steps~~ — Component picker, preview, etc.

---

## Open Questions

- [x] ~~Background animation?~~ → Tesla coil lightning (decided 2026-01-08)
- [ ] How many templates based on actual target segments?
- [ ] Semantic zones vs. spatial zones for grid system?
- [ ] What's the minimum component set for MVP?
- [ ] How does AI automation interact with template zones?

---

## Related Documents

| Document | Description |
|----------|-------------|
| [README](./README.md) | Document index and quick reference |
| [Homepage Design](./znapsite-homepage-design.md) | Znapsite.com homepage spec (v2.0 - IMPLEMENTED) |
| [Layout Templates](./layout-templates-spec.md) | Detailed template specifications |
| [Component Library](./component-library-spec.md) | Atomic design system and tokens |
| [Free Components](./free-component-catalog.md) | 61 available Aceternity/Magic UI components |
