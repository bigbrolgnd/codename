# Znapsite.com Homepage Design Spec

**Version:** 2.0
**Date:** 2026-01-08
**Status:** IMPLEMENTED

---

## Overview

**Template:** Tool-First Onboarding (Value-First UX)
**Goal:** Immediate tool entry — users build before signing up
**Vibe:** Electric, fast, pixel-art aesthetic with tesla coil lightning

**Key Change (v2.0):** This is NOT a traditional SaaS landing page. It's a direct-entry tool where users describe/upload/link their content and get instant results. Account creation happens at step 6, AFTER they've seen value.

---

## Hero Section

### Layout (Tool-First Onboarding)
```
┌─────────────────────────────────────────────────────────────┐
│  [Tesla Coil Lightning Background - Full Screen]             │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │              [Znapsite Logo - Glowing Z]              │   │
│  │                                                       │   │
│  │           "Describe Your Website"                     │   │
│  │        "Tell us what you need. AI will build it."     │   │
│  │                                                       │   │
│  │  ┌───────────────────────────────────────────────┐   │   │
│  │  │  [Input Field - Design | Link | Upload Tabs]  │   │   │
│  │  │                                               │   │   │
│  │  │  ┌─────────────────────────────────────────┐ │   │   │
│  │  │  │ Input: "A landing page for my salon..." │ │   │   │
│  │  │  │ [Build My Site ⚡]                      │ │   │   │
│  │  │  └─────────────────────────────────────────┘ │   │   │
│  │  └───────────────────────────────────────────────┘   │   │
│  │                                                       │   │
│  │  ┌───────┐ ┌───────┐ ┌───────┐                       │   │
│  │  │ ✨    │ │ 🔗   │ │ 📎   │  [Tab Selector]        │   │
│  │  │Design │ │ Link  │ │Upload │                       │   │
│  │  └───────┘ └───────┘ └───────┘                       │   │
│  │                                                       │   │
│  │  ✓ No credit card required                           │   │
│  │  ✓ See your site in 2 minutes                        │   │
│  │  ✓ Free to try                                       │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Hero Content

**Logo:** Znapsite banner logo with glowing "Z" (pink glow effect)

**Headline:** "Describe Your Website"
**Subheadline:** "Tell us what you need. AI will build it for you."

**Input Modes (Tab Selector):**
| Mode | Input Type | Placeholder | Button |
|------|-----------|-------------|--------|
| **Design** | Text input | "A landing page for my beauty salon" | "Build My Site ⚡" |
| **Link** | URL input | "Paste your website URL, Instagram, TikTok..." | "Continue ⚡" |
| **Upload** | File dropzone | "Drag your price list or menu here" | Auto-process |

**Trust Badges (3x large):**
- ✓ No credit card required
- ✓ See your site in 2 minutes
- ✓ Free to try

---

## Hero Background: Tesla Coil Lightning

**Concept:**
- Two Tesla coils positioned at bottom-left and bottom-right corners
- Pink pixel-art lightning bolts arc from coils toward center/top
- 6x6 pixels (same size as sand particles would have been)
- Fast electrical timing — bolts spawn every 50-150ms
- Jagged branching paths like real electricity
- Flickering effect on active bolts
- Occasional spark pixels around electricity

**Technical approach:**
- HTML Canvas 2D
- Tesla coil bases rendered as stacked pixel spheres
- Lightning bolts generated with recursive branching algorithm
- 15-25 segments per bolt with random jagged offsets
- Branch probability: 25% per segment (3-5 segment branches)
- Bolt lifetime: 80-200ms (very fast)
- Respects `prefers-reduced-motion`

**Why Lightning (Not Hourglass):**
- Faster, more energetic feel
- Better communicates "AI speed" and "instant results"
- Tesla coils suggest power/energy/automation
- Pixel art aesthetic matches brand personality
- Electrical branching feels like AI "thinking"

---

## Onboarding Flow (Post-Hero)

### Step Sequence

| Step | Screen | Account Required? | Description |
|------|--------|-------------------|-------------|
| 1 | **Hero Input** | ❌ No | Describe/upload/link content |
| 2 | **Business Details** | ❌ No | Name, industry, location |
| 3 | **Wireframe Selection** | ❌ No | Choose layout template |
| 4 | **Component Picker** | ❌ No | Add sections (features, testimonials, etc.) |
| 5 | **Preview** | ❌ No | See generated site with live preview |
| 6 | **Customer Info** | ⚠️ NOW | Email, password to claim site |
| 7 | **Launch** | ✅ Yes | Deploy to znapsite.com/subdomain |

---

## Zones & Components (Removed/Modified)

### REMOVED Zones (SaaS Landing Page Elements)
These were in v1.0 but removed for tool-first approach:

| Zone | Status | Reason |
|------|--------|--------|
| Pricing tiers | ❌ Removed | No pricing until after preview |
| Features grid | ❌ Removed | Value is shown, not described |
| Testimonials | ❌ Removed | Social proof not needed at entry |
| "How It Works" | ❌ Removed | Tool IS the how-it-works demo |
| Partner logos | ❌ Removed | Not relevant for tool entry |

### MODIFIED Zones

| Zone | Change | Description |
|------|--------|-------------|
| Navbar | Simplified | Logo + minimal links (no "Start Free" CTA) |
| Hero | Complete redesign | Input-first, not headline-first |
| Trust badges | Enlarged 3x | Now prominent text-lg with 28px icons |

---

## Design Tokens

### Color Scheme

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg` | `#0a0a0a` | Page background (near black) |
| `--color-surface` | `#1a1a1a` | Card/glass backgrounds |
| `--color-accent` | `#d552b7` | Brand pink (CTAs, Z glow) |
| `--color-accent-light` | `#e91e8c` | Hover states, lighter pink |
| `--text-all` | `#ffffff` | Primary text |
| `--text-muted` | `#a0a0a0` | Secondary text |

### Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Logo | 192px (h-48) → 240px (h-60) | 700 | - |
| H1 (Hero) | 36px → 48px (text-4xl md:text-5xl) | 700 | 1.1 |
| Subhero | 20px → 24px (text-xl md:text-2xl) | 400 | 1.5 |
| Trust badges | 18px (text-lg) - **3x larger** | 400 | 1.5 |
| Input text | 18px (text-lg) | 400 | - |
| Button text | 18px (text-lg) | 700 | - |

### Spacing

| Element | Value |
|---------|-------|
| Logo to title | 2rem (mb-8) |
| Title to input | 2rem (mb-8) |
| Input to tabs | 1.5rem (mb-6) |
| Tabs to trust badges | 2rem (mb-8) |

---

## Component Specs

### Tab Bar (Mode Selector)

```tsx
<div className="glass-card p-1.5 rounded-2xl inline-flex">
  <button className={mode === 'design' ? 'bg-[var(--color-accent)]' : ''}>
    ✨ Design
  </button>
  <button className={mode === 'link' ? 'bg-[var(--color-accent)]' : ''}>
    🔗 Link
  </button>
  <button className={mode === 'upload' ? 'bg-[var(--color-accent)]' : ''}>
    📎 Upload
  </button>
</div>
```

**States:**
- Active: Pink background (`--color-accent`), white text
- Inactive: Transparent, muted text, hover white/5

### Input Container (Glass Card)

```css
.glass-card {
  background: rgba(17, 17, 17, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 2px solid rgba(213, 82, 183, 0.4);
  border-radius: 1rem;
}
```

**Note:** NO box-shadow glow (removed per user request)

### Submit Button

```tsx
<button className="
  bg-[var(--color-accent)]
  hover:bg-[var(--color-accent-light)]
  disabled:bg-white/20
  text-white
  px-8 py-4
  rounded-xl
  font-bold text-lg
  transition-all
">
  Build My Site ⚡
</button>
```

### Trust Badges

```tsx
<div className="flex flex-wrap justify-center gap-6 text-lg">
  <div className="flex items-center gap-1">
    <svg width="28" height="28">...</svg>
    <span>No credit card required</span>
  </div>
  <div className="flex items-center gap-1">
    <svg width="28" height="28">...</svg>
    <span>See your site in 2 minutes</span>
  </div>
  <div className="flex items-center gap-1">
    <svg width="28" height="28">...</svg>
    <span>Free to try</span>
  </div>
</div>
```

**Size:** 3x larger than v1.0 (text-xs → text-lg, 14px icons → 28px icons)

---

## Technical Implementation

### File Structure

```
apps/marketing-site/src/
├── App.tsx                    # Main app with onboarding flow
├── main.tsx                   # Entry point
├── index.css                  # CSS variables & base styles
├── components/
│   ├── backgrounds/
│   │   ├── PixelLightning.tsx # Tesla coil lightning (NEW)
│   │   └── PixelHourglass.tsx # DEPRECATED - replaced by lightning
│   └── onboarding/
│       ├── OnboardingProgress.tsx  # Step indicator
│       ├── ComponentPicker.tsx    # Step 4: Feature selection
│       ├── CustomerInfoForm.tsx   # Step 6: Signup form
│       └── WireframeSelector.tsx  # Step 3: Template picker
└── public/
    ├── banner-logo.svg        # Hero logo with glowing Z
    ├── logo-icon.svg          # Favicon
    └── logo.png               # Open graph image
```

### Key Components

#### PixelLightning.tsx
- Canvas-based Tesla coil animation
- Positioned: `fixed inset-0 pointer-events-none z-0`
- Props: `pixelSize` (default: 6), `color` (default: var(--color-accent))

#### App State
```tsx
const [currentStep, setCurrentStep] = useState(1);
const [inputMode, setInputMode] = useState<'design' | 'link' | 'upload'>('design');
```

---

## Responsive Behavior

| Breakpoint | Logo | Title | Input | Trust Badges |
|------------|------|-------|-------|--------------|
| Mobile (<640px) | h-48 (192px) | text-4xl | Stacked vertical | Stacked vertical |
| Desktop (≥640px) | h-60 (240px) | text-5xl | Row layout | Row layout |

---

## Deployment

### URLs
- **Production:** https://znapsite.com
- **Preview:** http://localhost:8080 (dev)
- **Proxy:** Caddy reverse_proxy to localhost:8080

### Build Command
```bash
cd apps/marketing-site
npm run build
npm run preview -- --host 0.0.0.0 --port 8080
```

---

## Change History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-07 | Initial spec (SaaS landing page, hourglass background) |
| 2.0 | 2026-01-08 | Tool-first onboarding, Tesla coil lightning, tab inputs, 3x trust badges |

---

## Related Documents

| Document | Description |
|----------|-------------|
| [README](./README.md) | Document index and quick reference |
| [Course Correction](../../../.agent/workflows/bmad/znapsite-frontend-course-correction.md) | Tool-first UX decision rationale |
| [Discovery Notes](./znapsite-template-system-discovery.md) | Product vision context |
| [Component Library](./component-library-spec.md) | Token and animation definitions |
| [Free Components](./free-component-catalog.md) | Featured component sources |
