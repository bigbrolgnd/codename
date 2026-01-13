# Znapsite Component Library Specification

**Version:** 1.0-draft  
**Date:** 2026-01-07

---

## Naming Philosophy

Components are named by **what they do for AI automation**, not what they look like.

**Pattern:** `[Action]-[Target]` or `[Purpose]-[Content]`

Examples:
- `capture-email` not "newsletter signup"
- `prove-trust` not "testimonial carousel"
- `explain-offer` not "feature card"

This enables AI to understand intent: *"Add a prove-trust component to zone-trust"*

---

## Atomic Design Hierarchy

```
ATOMS → MOLECULES → ORGANISMS → ZONES → TEMPLATES
```

| Level | Description | Example |
|-------|-------------|---------|
| **Atoms** | Smallest units, unsplittable | Button, Input, Heading, Image |
| **Molecules** | Atom combinations, single purpose | Input + Button = `capture-email-inline` |
| **Organisms** | Molecule groups, complete sections | `prove-trust-carousel` |
| **Zones** | Semantic page regions | `zone-trust`, `zone-features` |
| **Templates** | Full page structures | The Starter, The Pro, etc. |

---

## ATOMS (Base Elements)

### Text Atoms
| Atom | Variants | AI Purpose |
|------|----------|------------|
| `heading` | h1, h2, h3, h4, h5, h6 | `set-hierarchy` |
| `paragraph` | lead, body, small | `add-context` |
| `label` | default, emphasis | `name-element` |
| `link` | inline, standalone | `connect-page` |

### Action Atoms
| Atom | Variants | AI Purpose |
|------|----------|------------|
| `button` | primary, secondary, ghost, outline | `trigger-action` |
| `input` | text, email, tel, textarea | `collect-data` |
| `select` | dropdown, radio, checkbox | `choose-option` |

### Media Atoms
| Atom | Variants | AI Purpose |
|------|----------|------------|
| `image` | hero, thumbnail, avatar, icon | `show-visual` |
| `video` | embed, background, inline | `play-media` |
| `icon` | system, social, custom | `signal-meaning` |

### Layout Atoms
| Atom | Variants | AI Purpose |
|------|----------|------------|
| `divider` | line, space, decorative | `separate-content` |
| `badge` | status, label, count | `highlight-info` |
| `avatar` | image, initials, icon | `show-identity` |

---

## MOLECULES (Purpose Combinations)

### Capture Molecules (Get User Data)

| Molecule | Composition | AI Purpose |
|----------|-------------|------------|
| `capture-email` | input[email] + button | Collect email for list |
| `capture-email-inline` | input[email] + button (row) | Inline email collection |
| `capture-contact` | input[name] + input[email] + input[message] + button | Collect contact inquiry |
| `capture-booking` | date-picker + time-picker + input[name] + button | Schedule appointment |
| `capture-search` | input[search] + button[icon] | Search site content |

### Connect Molecules (Link to Actions)

| Molecule | Composition | AI Purpose |
|----------|-------------|------------|
| `connect-cta` | heading + paragraph + button | Drive primary action |
| `connect-cta-dual` | heading + paragraph + button + button | Offer two paths |
| `connect-social` | icon + icon + icon... | Link to social profiles |
| `connect-nav-item` | link + icon(optional) | Navigate within site |
| `connect-download` | heading + button[download] | Offer downloadable asset |

### Explain Molecules (Describe Things)

| Molecule | Composition | AI Purpose |
|----------|-------------|------------|
| `explain-feature` | icon + heading + paragraph | Describe single benefit |
| `explain-step` | number + heading + paragraph | Describe process step |
| `explain-stat` | number[large] + label | Highlight metric |
| `explain-price` | heading + price + features-list + button | Show pricing tier |
| `explain-faq` | heading[question] + paragraph[answer] | Answer common question |

### Prove Molecules (Build Trust)

| Molecule | Composition | AI Purpose |
|----------|-------------|------------|
| `prove-quote` | paragraph[quote] + avatar + label[name] | Show testimonial |
| `prove-logo` | image[logo] | Display partner/client |
| `prove-rating` | stars + paragraph + label[name] | Show review with rating |
| `prove-case` | image + heading + paragraph + link | Summarize success story |

### Show Molecules (Display Content)

| Molecule | Composition | AI Purpose |
|----------|-------------|------------|
| `show-card` | image + heading + paragraph + link | Generic content card |
| `show-product` | image + heading + price + button | Display product for sale |
| `show-person` | avatar + heading + paragraph + connect-social | Display team member |
| `show-post` | image + heading + label[date] + paragraph | Display blog/content preview |

---

## ORGANISMS (Complete Sections)

### Hero Organisms (First Impression)

| Organism | Composition | Grid | AI Purpose |
|----------|-------------|------|------------|
| `hero-centered` | heading + paragraph + connect-cta | Full | Centered message + action |
| `hero-split` | [heading + paragraph + connect-cta] + image | Half + Half | Message left, visual right |
| `hero-video` | video[background] + heading + connect-cta | Full | Video backdrop with overlay |
| `hero-chat` | heading + paragraph + chat-window | Half + Half | Show product interaction |

### Feature Organisms (Explain Value)

| Organism | Composition | Grid | AI Purpose |
|----------|-------------|------|------------|
| `features-grid` | explain-feature × 3-6 | Quarter | Grid of benefits |
| `features-alternating` | [explain-feature + image] × n | Half (alternating) | Deep dive features |
| `features-icons` | explain-feature[icon-focused] × 4-8 | Quarter | Icon-led feature list |
| `features-comparison` | table[features × tiers] | Full | Compare options |

### Trust Organisms (Prove Worth)

| Organism | Composition | Grid | AI Purpose |
|----------|-------------|------|------------|
| `trust-quotes` | prove-quote × 3-6 | Quarter or Carousel | Multiple testimonials |
| `trust-logos` | prove-logo × 4-12 | Quarter (row) | Partner/client logos |
| `trust-reviews` | prove-rating × n | Half or Full | Customer reviews |
| `trust-cases` | prove-case × 2-4 | Half | Case study previews |

### Capture Organisms (Convert Visitors)

| Organism | Composition | Grid | AI Purpose |
|----------|-------------|------|------------|
| `capture-hero-email` | heading + paragraph + capture-email | Full | Hero with email capture |
| `capture-section-email` | heading + capture-email | Full | Mid-page email capture |
| `capture-contact-form` | heading + capture-contact | Full or Half | Contact inquiry |
| `capture-booking-form` | heading + capture-booking | Full or Half | Appointment scheduling |

### Content Organisms (Display Work)

| Organism | Composition | Grid | AI Purpose |
|----------|-------------|------|------------|
| `content-gallery` | show-card × n | Quarter (masonry) | Portfolio display |
| `content-posts` | show-post × n | Quarter or Half | Blog/content feed |
| `content-products` | show-product × n | Quarter | Product catalog |
| `content-team` | show-person × n | Quarter | Team members |

### Navigation Organisms (Guide Users)

| Organism | Composition | Grid | AI Purpose |
|----------|-------------|------|------------|
| `nav-clean` | logo + connect-nav-item × n + button | Full | Standard navbar |
| `nav-bold` | logo + connect-nav-item × n + button[large] | Full | High-contrast navbar |
| `nav-floating` | connect-nav-item × n (pill) | Centered | Modern floating nav |
| `nav-split` | connect-nav-item × n + logo + connect-nav-item × n | Full | Symmetrical nav |
| `nav-minimal` | logo + hamburger | Full | Mobile-first nav |

### Footer Organisms (Close Page)

| Organism | Composition | Grid | AI Purpose |
|----------|-------------|------|------------|
| `footer-simple` | logo + connect-nav-item × n + connect-social | Full | Minimal footer |
| `footer-columns` | [heading + link × n] × 3-4 + connect-social | Quarter | Multi-column links |
| `footer-contact` | address + phone + email + connect-social | Full | Contact-focused |

---

## Zone → Organism Mapping

| Zone | Allowed Organisms |
|------|-------------------|
| `zone-header` | nav-* |
| `zone-hero` | hero-*, capture-hero-* |
| `zone-features` | features-* |
| `zone-trust` | trust-* |
| `zone-content` | content-* |
| `zone-capture` | capture-* |
| `zone-faq` | explain-faq (accordion) |
| `zone-pricing` | explain-price × n |
| `zone-footer` | footer-* |

---

## AI Automation Commands

With this naming, AI can process requests like:

| User Says | AI Interprets |
|-----------|---------------|
| "Add testimonials" | Insert `trust-quotes` in `zone-trust` |
| "I need a signup form" | Insert `capture-email` or `capture-section-email` |
| "Show my services" | Insert `features-grid` with `explain-feature` molecules |
| "Add pricing" | Insert `explain-price` × n in `zone-pricing` |
| "Display my portfolio" | Insert `content-gallery` in `zone-content` |

---

## Component Variants

Each organism supports **style variants** (user customization):

| Variant Type | Options | Effect |
|--------------|---------|--------|
| **Alignment** | left, center, right | Content alignment |
| **Density** | compact, default, spacious | Padding/spacing |
| **Contrast** | light, dark, accent | Background treatment |
| **Motion** | static, subtle, animated | Entrance/interaction |

---

## Next Steps

1. Map each template to its default organism set
2. Define organism → molecule → atom composition in code
3. Build Storybook/component documentation
4. Test: Can we build 6 visually distinct sites from this library?

---

## Typography Design Tokens

### Token Hierarchy (Overlapping Groups)

Tokens cascade: changing a parent token affects all children unless overridden.

```
┌─────────────────────────────────────────────────────────────┐
│                     --text-all                              │  ← Global text color
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 --text-content                       │   │  ← All body/reading text
│  │  ┌────────────────┐  ┌────────────────┐              │   │
│  │  │ --text-body    │  │ --text-caption │              │   │
│  │  └────────────────┘  └────────────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 --text-headings                      │   │  ← All heading text
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │--text-h1│ │--text-h2│ │--text-h3│ │--text-h4│     │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 --text-interactive                   │   │  ← All clickable text
│  │  ┌────────────────┐  ┌────────────────┐              │   │
│  │  │ --text-button  │  │ --text-link    │              │   │
│  │  └────────────────┘  └────────────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Token Definitions

#### Global Layer
| Token | Default | Affects |
|-------|---------|---------|
| `--text-all` | `#1a1a1a` (dark) | Everything with text |
| `--text-all-inverse` | `#ffffff` | Text on dark backgrounds |

#### Group Layer
| Token | Inherits From | Affects |
|-------|---------------|---------|
| `--text-headings` | `--text-all` | h1, h2, h3, h4, h5, h6 |
| `--text-content` | `--text-all` | Body, paragraphs, captions |
| `--text-interactive` | `--text-all` | Buttons, links, nav items |
| `--text-accent` | (standalone) | Highlighted/branded text |

#### Specific Layer
| Token | Inherits From | Affects |
|-------|---------------|---------|
| `--text-h1` | `--text-headings` | H1 only |
| `--text-h2` | `--text-headings` | H2 only |
| `--text-h3` | `--text-headings` | H3 only |
| `--text-h4` | `--text-headings` | H4 only |
| `--text-body` | `--text-content` | Paragraphs |
| `--text-caption` | `--text-content` | Small text, labels |
| `--text-button` | `--text-interactive` | Button text |
| `--text-link` | `--text-interactive` | Link text |
| `--text-nav` | `--text-interactive` | Navigation items |

---

### Typography Scale (Size Tokens)

Using a **1.25 ratio** (Major Third) for harmonious scaling:

| Token | Base (px) | rem | Use |
|-------|-----------|-----|-----|
| `--size-h1` | 48 | 3rem | Page title |
| `--size-h2` | 38 | 2.4rem | Section title |
| `--size-h3` | 31 | 1.9rem | Subsection |
| `--size-h4` | 25 | 1.56rem | Card title |
| `--size-body` | 16 | 1rem | Body text |
| `--size-body-lg` | 20 | 1.25rem | Lead paragraph |
| `--size-caption` | 14 | 0.875rem | Small text |
| `--size-micro` | 12 | 0.75rem | Labels, badges |

### Font Weight Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--weight-headings` | 700 | All headings default |
| `--weight-body` | 400 | Paragraphs |
| `--weight-button` | 600 | Button text |
| `--weight-emphasis` | 600 | Bold inline text |

### Line Height Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--leading-tight` | 1.1 | Headings |
| `--leading-normal` | 1.5 | Body text |
| `--leading-loose` | 1.75 | Long-form reading |

---

### CSS Implementation Pattern

```css
:root {
  /* Global */
  --text-all: #1a1a1a;
  
  /* Groups (inherit from global) */
  --text-headings: var(--text-all);
  --text-content: var(--text-all);
  --text-interactive: var(--text-all);
  --text-accent: #e91e8c; /* Brand pink */
  
  /* Specific (inherit from groups) */
  --text-h1: var(--text-headings);
  --text-h2: var(--text-headings);
  --text-h3: var(--text-headings);
  --text-body: var(--text-content);
  --text-caption: var(--text-content);
  --text-button: var(--text-interactive);
  --text-link: var(--text-accent);
}

/* User overrides example: make all headings pink */
.user-theme {
  --text-headings: #e91e8c;
  /* --text-h1, h2, h3 all become pink automatically */
}

/* User overrides example: just h1 is pink */
.user-theme-alt {
  --text-h1: #e91e8c;
  /* Only h1 affected, h2/h3 stay default */
}
```

---

### User-Facing Token Groups (UI)

In the theme editor, users see simplified controls:

| Control | Affects Tokens |
|---------|---------------|
| **"All Text"** | `--text-all` |
| **"Headings"** | `--text-headings` |
| **"Body Text"** | `--text-content` |
| **"Buttons & Links"** | `--text-interactive` |
| **"Accent Color"** | `--text-accent` |

Advanced mode exposes individual tokens (h1, h2, button, etc.)

---

## Animation Design Tokens

### Animation Philosophy

Animations are **opt-in** and **semantic** — named by effect, not implementation.

Users control:
1. **What animates** (text, components, backgrounds)
2. **How it animates** (preset styles)
3. **When it triggers** (on load, on scroll, on hover)

### Animation Trigger Tokens

| Token | Trigger | Use Case |
|-------|---------|----------|
| `--anim-trigger-load` | Page/section load | Hero entrance |
| `--anim-trigger-scroll` | Element enters viewport | Reveal on scroll |
| `--anim-trigger-hover` | Mouse hover | Interactive feedback |
| `--anim-trigger-click` | On click/tap | Action confirmation |

### Animation Style Presets

#### Entrance Animations (appear)
| Preset | Effect | Best For |
|--------|--------|----------|
| `entrance-fade` | Opacity 0→1 | Subtle reveals |
| `entrance-slide-up` | Fade + translate Y | Cards, features |
| `entrance-slide-left` | Fade + translate X | Alternating content |
| `entrance-slide-right` | Fade + translate X | Alternating content |
| `entrance-zoom` | Fade + scale 0.9→1 | Hero images |
| `entrance-blur` | Blur + fade in | Text reveals |
| `entrance-typewriter` | Characters appear sequentially | Headlines |
| `entrance-word-reveal` | Words slide up one by one | Statements |

#### Attention Animations (emphasis)
| Preset | Effect | Best For |
|--------|--------|----------|
| `attention-pulse` | Subtle scale pulse | CTAs, buttons |
| `attention-glow` | Box-shadow pulse | Active states |
| `attention-shake` | Horizontal shake | Errors, urgency |
| `attention-bounce` | Vertical bounce | Notifications |

#### Hover Animations (interactive)
| Preset | Effect | Best For |
|--------|--------|----------|
| `hover-lift` | Translate Y + shadow | Cards |
| `hover-grow` | Scale 1.02-1.05 | Buttons, images |
| `hover-glow` | Box-shadow increase | Interactive elements |
| `hover-underline` | Animated underline | Links |
| `hover-fill` | Background fill sweep | Buttons |

#### Exit Animations (disappear)
| Preset | Effect | Best For |
|--------|--------|----------|
| `exit-fade` | Opacity 1→0 | Modals, tooltips |
| `exit-slide-down` | Fade + translate Y | Dismissed content |
| `exit-shrink` | Scale to 0 | Deleted items |

### Animation Timing Tokens

| Token | Value | Feel |
|-------|-------|------|
| `--anim-duration-fast` | 150ms | Micro-interactions |
| `--anim-duration-normal` | 300ms | Standard transitions |
| `--anim-duration-slow` | 500ms | Dramatic reveals |
| `--anim-duration-dramatic` | 800ms | Hero entrances |

| Token | Value | Feel |
|-------|-------|------|
| `--anim-easing-default` | `ease-out` | Natural deceleration |
| `--anim-easing-bounce` | `cubic-bezier(0.68,-0.55,0.27,1.55)` | Playful overshoot |
| `--anim-easing-smooth` | `cubic-bezier(0.4,0,0.2,1)` | Material-style |
| `--anim-easing-sharp` | `cubic-bezier(0.4,0,0.6,1)` | Snappy |

### Animation Delay (Stagger)

For sequential animations (cards in a grid, list items):

| Token | Value | Use |
|-------|-------|-----|
| `--anim-stagger-none` | 0ms | All at once |
| `--anim-stagger-fast` | 50ms | Quick cascade |
| `--anim-stagger-normal` | 100ms | Standard cascade |
| `--anim-stagger-slow` | 150ms | Dramatic cascade |

---

### Component Animation Props

Each organism accepts animation props:

```tsx
<FeatureGrid
  animation={{
    entrance: "entrance-slide-up",    // How it appears
    trigger: "scroll",                 // When it triggers
    stagger: "normal",                 // Delay between items
    duration: "normal",                // Speed
  }}
/>
```

### Text Animation Props

Text atoms/molecules accept:

```tsx
<Heading
  animation={{
    entrance: "entrance-typewriter",   // Typewriter effect
    trigger: "load",
    duration: "slow",
  }}
>
  Welcome to Znapsite
</Heading>
```

---

### User-Facing Animation Controls (UI)

**Simple Mode (per zone):**
| Control | Options |
|---------|---------|
| "Zone Animation" | None, Fade In, Slide Up, Zoom |
| "Trigger" | On Load, On Scroll |

**Advanced Mode (per component):**
| Control | Options |
|---------|---------|
| "Entrance Style" | Full preset list |
| "Trigger" | Load, Scroll, Hover |
| "Duration" | Fast, Normal, Slow |
| "Delay/Stagger" | None, Fast, Normal, Slow |

**Text-Specific:**
| Control | Options |
|---------|---------|
| "Text Animation" | None, Typewriter, Word Reveal, Blur In |
| "Duration" | Fast, Normal, Slow, Dramatic |

---

### Implementation: Framer Motion

Using Framer Motion (already in stack) for all animations:

```tsx
// Animation preset definitions
const entrancePresets = {
  'entrance-fade': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  'entrance-slide-up': {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  'entrance-typewriter': {
    // Custom variant for character-by-character
  },
};

// Component usage
<motion.div
  variants={entrancePresets['entrance-slide-up']}
  initial="initial"
  whileInView="animate"  // trigger: scroll
  viewport={{ once: true }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  <FeatureCard />
</motion.div>
```

### Scroll-Triggered Animations

Using `whileInView` with Intersection Observer:

```tsx
<motion.section
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
  transition={{ staggerChildren: 0.1 }}
>
  {features.map((f) => (
    <motion.div variants={cardVariants}>
      <FeatureCard {...f} />
    </motion.div>
  ))}
</motion.section>
```

---

### Performance Considerations

1. **GPU-accelerated only**: Only animate `transform` and `opacity`
2. **Lazy load**: Don't animate below-fold content until near viewport
3. **Reduced motion**: Respect `prefers-reduced-motion` media query
4. **Once only**: Scroll animations trigger once by default

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Technology Decision: Animation Stack

**Decision:** Option A — Aceternity UI / Magic UI + Framer Motion

### Rationale
- Rich library of pre-built animated hero sections
- Copy-paste components accelerate development
- Framer Motion already in stack
- Bundle size (~25KB) acceptable for landing pages

### Component Sources

**Aceternity UI** (ui.aceternity.com)
- 3D Card effects
- Spotlight backgrounds
- Meteor animations
- Text reveal effects
- Parallax scroll

**Magic UI** (magicui.design)
- Animated borders
- Gradient backgrounds
- Number tickers
- Marquee components
- Shimmer buttons

### Usage Pattern
1. Copy component from Aceternity/Magic UI
2. Adapt to our atomic design token system
3. Wrap with our organism interface
4. Expose animation props per our token spec

### Future Consideration
If bundle size becomes critical, migrate animation layer to Motion (motion.dev) with minimal API changes — same author, similar syntax, 8x smaller.

---

## Component Marketplace Architecture

### Overview

Aceternity UI and Magic UI components serve as the **component style source**. Users can:
1. Choose a component "style" from our curated marketplace
2. Apply their own design tokens (colors, fonts, spacing)
3. Mix different styles within the same template

The **structure** (zones, grids, semantic names) stays constant. The **visual style** is swappable.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S DESIGN TOKENS                      │
│  (colors, fonts, spacing — set once, applied everywhere)    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐      │
│    │ HERO STYLE  │   │ HERO STYLE  │   │ HERO STYLE  │      │
│    │  "Spotlight"│   │  "Gradient" │   │  "Minimal"  │      │
│    │ (Aceternity)│   │ (Magic UI)  │   │ (Custom)    │      │
│    └─────────────┘   └─────────────┘   └─────────────┘      │
│         ↓                 ↓                 ↓                │
│    ┌─────────────────────────────────────────────────┐      │
│    │         RENDERED WITH USER'S TOKENS             │      │
│    │   (same pink accent, same Inter font, etc.)     │      │
│    └─────────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Style Registry

Each organism has multiple **style variants** sourced from Aceternity/Magic UI:

#### Hero Styles
| Style ID | Name | Source | Description |
|----------|------|--------|-------------|
| `hero-spotlight` | Spotlight | Aceternity | Mouse-follow spotlight effect |
| `hero-aurora` | Aurora | Aceternity | Animated gradient aurora |
| `hero-meteors` | Meteors | Aceternity | Falling meteor particles |
| `hero-grid` | Grid | Magic UI | Animated dot grid background |
| `hero-gradient` | Gradient | Magic UI | Mesh gradient background |
| `hero-minimal` | Minimal | Custom | Clean, no effects |

#### Card Styles
| Style ID | Name | Source | Description |
|----------|------|--------|-------------|
| `card-3d` | 3D Tilt | Aceternity | 3D tilt on hover |
| `card-glow` | Glow | Aceternity | Glowing border effect |
| `card-shimmer` | Shimmer | Magic UI | Shimmer/shine effect |
| `card-border` | Animated Border | Magic UI | Rotating gradient border |
| `card-lift` | Lift | Custom | Simple lift + shadow |

#### Button Styles
| Style ID | Name | Source | Description |
|----------|------|--------|-------------|
| `btn-shimmer` | Shimmer | Magic UI | Shimmer sweep effect |
| `btn-glow` | Glow | Aceternity | Pulsing glow |
| `btn-fill` | Fill | Custom | Background fill on hover |
| `btn-solid` | Solid | Custom | Standard button |

#### Text Reveal Styles
| Style ID | Name | Source | Description |
|----------|------|--------|-------------|
| `text-generate` | Generate | Aceternity | AI-style character reveal |
| `text-typewriter` | Typewriter | Aceternity | Classic typewriter |
| `text-blur` | Blur In | Magic UI | Blur to sharp reveal |
| `text-slide` | Slide Up | Custom | Word-by-word slide |

### Token Integration

All Aceternity/Magic UI components are **wrapped** to consume our design tokens:

```tsx
// Original Aceternity component
<SpotlightCard className="bg-slate-900 border-slate-800">
  <h2 className="text-white">Content</h2>
</SpotlightCard>

// Wrapped for Znapsite (consumes tokens)
<SpotlightCard
  className={cn(
    "bg-[var(--color-surface)]",
    "border-[var(--color-border)]"
  )}
>
  <h2 style={{ color: 'var(--text-headings)' }}>Content</h2>
</SpotlightCard>
```

### Component Wrapper Pattern

Every marketplace component is wrapped with:

```tsx
interface ZnapComponentProps {
  // Core content
  children: React.ReactNode;
  
  // Style variant (from marketplace)
  styleId: string;
  
  // Animation overrides (optional)
  animation?: {
    entrance?: string;
    trigger?: 'load' | 'scroll' | 'hover';
    duration?: 'fast' | 'normal' | 'slow';
  };
  
  // Token overrides (optional, for component-level customization)
  tokens?: {
    background?: string;
    text?: string;
    accent?: string;
  };
}
```

### Marketplace Categories

Users browse styles by **component type**:

| Category | Example Styles |
|----------|----------------|
| **Hero Backgrounds** | Spotlight, Aurora, Meteors, Grid, Gradient |
| **Cards** | 3D Tilt, Glow, Shimmer, Animated Border |
| **Buttons** | Shimmer, Glow, Fill, Outline |
| **Text Effects** | Generate, Typewriter, Blur, Slide |
| **Sections** | Bento Grid, Alternating, Masonry |
| **Navigation** | Floating, Clean, Bold, Minimal |

### Style Compatibility Matrix

Not all styles work in all contexts. We define compatibility:

| Component Type | Compatible Zones | Mobile Fallback |
|----------------|------------------|-----------------|
| Hero Backgrounds | `zone-hero` only | Simplified/static |
| 3D Cards | Any card context | 2D with shadow |
| Shimmer Buttons | Any button context | Solid button |
| Text Generate | Headings only | Instant reveal |

### Data Model

```typescript
interface ComponentStyle {
  id: string;                    // 'hero-spotlight'
  name: string;                  // 'Spotlight'
  source: 'aceternity' | 'magic-ui' | 'custom';
  category: 'hero' | 'card' | 'button' | 'text' | 'section' | 'nav';
  preview: string;               // Preview image/GIF URL
  compatibleZones: string[];     // ['zone-hero']
  mobileStrategy: 'simplify' | 'static' | 'same';
  tokenMappings: {
    // Maps component's internal classes to our tokens
    background: '--color-surface';
    text: '--text-headings';
    accent: '--color-accent';
  };
}
```

### Template + Style Presets

Each of our 6 templates comes with **default style selections**, but users can swap any:

| Template | Default Hero | Default Card | Default Button |
|----------|-------------|--------------|----------------|
| The Starter | `hero-gradient` | `card-lift` | `btn-shimmer` |
| The Creative | `hero-minimal` | `card-3d` | `btn-solid` |
| The Pro | `hero-spotlight` | `card-glow` | `btn-fill` |
| The Builder | `hero-grid` | `card-border` | `btn-shimmer` |
| The Personal | `hero-aurora` | `card-lift` | `btn-solid` |
| The Shop | `hero-gradient` | `card-shimmer` | `btn-fill` |

### Implementation Steps

1. **Audit Aceternity + Magic UI** — catalog all usable components
2. **Create wrapper layer** — standardize props, inject tokens
3. **Build style registry** — metadata for each style variant
4. **Build style picker UI** — marketplace browser for users
5. **Test token inheritance** — verify all styles respect user tokens

---

## Related Documents

| Document | Description |
|----------|-------------|
| [README](./README.md) | Document index and quick reference |
| [Discovery Notes](./znapsite-template-system-discovery.md) | Core product vision |
| [Layout Templates](./layout-templates-spec.md) | Templates that consume these components |
| [Homepage Design](./znapsite-homepage-design.md) | Component usage example |
| [Free Components](./free-component-catalog.md) | Specific Aceternity/Magic UI sources |
