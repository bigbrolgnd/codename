# Znapsite Layout Templates Specification

**Version:** 1.1-draft  
**Date:** 2026-01-07

---

## Overview

Templates define **structural layout decisions**, not visual design. Users customize colors, typography, and imagery. We control the structural system.

### Grid System Foundation

All templates use a **zone-based grid** with three block types:

| Block Type | Grid Span | Use Cases |
|------------|-----------|-----------|
| **Full-width Rectangle** | 12 cols | Hero, CTA banners, footers |
| **Half Rectangle** | 6 cols | 2-column layouts, feature pairs |
| **Quarter Square** | 3 cols | Feature grids, icon blocks, stats |

> Zones are **semantic** to enable AI automation: "put testimonials in trust zone"

---

## Navbar Styles (Shared Across All Templates)

All templates use one of **5 navbar styles**. Users pick the style; it applies uniformly.

| Style | Name | Description |
|-------|------|-------------|
| **1** | **Clean** | Logo left, links center, button right. Minimal. |
| **2** | **Bold** | Logo left, links right, large CTA button. High contrast. |
| **3** | **Floating** | Centered pill nav, hovers above content. Modern. |
| **4** | **Split** | Logo center, links split left/right. Symmetrical. |
| **5** | **Minimal** | Logo only (left), hamburger menu. Mobile-first. |

### Navbar Behavior
- **Sticky** on scroll (default, can be disabled)
- **Transparent → Solid** on scroll for hero overlays
- **Mobile**: All styles collapse to hamburger at <768px

---

## Template 1: "Starter" (Launch & Grow)

**Everyday name:** *The Starter*  
**What it's for:** Getting signups, launching products, running campaigns  
**Who it's for:** Anyone promoting something new

### Zone Structure

```
┌─────────────────────────────────────────────┐
│                   NAVBAR                     │
├─────────────────────────────────────────────┤
│                                             │
│                    HERO                      │  ← Big message + action
│                                             │
├─────────────────────────────────────────────┤
│               WHAT YOU GET                   │  ← Features/benefits
├──────────────────────┬──────────────────────┤
│       WHY IT WORKS   │    WHY IT WORKS      │  ← Proof points
├──────────────────────┴──────────────────────┤
│              PEOPLE LOVE IT                  │  ← Reviews, testimonials
├─────────────────────────────────────────────┤
│                 GET STARTED                  │  ← Final action
├─────────────────────────────────────────────┤
│                   FOOTER                     │
└─────────────────────────────────────────────┘
```

---

## Template 2: "Creative" (Show Your Work)

**Everyday name:** *The Creative*  
**What it's for:** Displaying visual work, portfolios, projects  
**Who it's for:** Designers, photographers, artists, makers

### Zone Structure

```
┌─────────────────────────────────────────────┐
│                   NAVBAR                     │
├─────────────────────────────────────────────┤
│                                             │
│              FEATURED WORK                   │  ← Hero piece (optional)
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│                 MY WORK                      │  ← Gallery grid
│                                             │
├─────────────────────────────────────────────┤
│                 ABOUT ME                     │  ← Short bio
├─────────────────────────────────────────────┤
│                   FOOTER                     │
└─────────────────────────────────────────────┘
```

---

## Template 3: "Pro" (Get Booked)

**Everyday name:** *The Pro*  
**What it's for:** Getting clients, showing services, building trust  
**Who it's for:** Consultants, agencies, local businesses, freelancers

### Zone Structure

```
┌─────────────────────────────────────────────┐
│                   NAVBAR                     │  ← + phone/contact CTA
├─────────────────────────────────────────────┤
│                                             │
│                    HERO                      │  ← Who you help + image
│                                             │
├─────────────────────────────────────────────┤
│               WHAT I OFFER                   │  ← Service cards
├──────────────────────┬──────────────────────┤
│      MY STORY        │   HAPPY CLIENTS      │  ← Trust split
├──────────────────────┴──────────────────────┤
│               HOW IT WORKS                   │  ← Process steps
├─────────────────────────────────────────────┤
│               LET'S CONNECT                  │  ← Contact/booking form
├─────────────────────────────────────────────┤
│                   FOOTER                     │  ← Location, hours
└─────────────────────────────────────────────┘
```

---

## Template 4: "Builder" (Sell Your Product)

**Everyday name:** *The Builder*  
**What it's for:** Selling software, apps, digital products  
**Who it's for:** Startups, indie makers, SaaS founders

### Zone Structure

```
┌─────────────────────────────────────────────┐
│                   NAVBAR                     │  ← + Login/Signup
├─────────────────────────────────────────────┤
│                                             │
│                    HERO                      │  ← Product + demo
│                                             │
├─────────────────────────────────────────────┤
│              TRUSTED BY                      │  ← Logo cloud
├─────────────────────────────────────────────┤
│              WHY IT'S GREAT                  │  ← Feature highlights
├──────────────────────┬──────────────────────┤
│     DEEP DIVE 1      │     DEEP DIVE 2      │  ← Feature details
├──────────────────────┴──────────────────────┤
│                  PRICING                     │  ← Plans table
├─────────────────────────────────────────────┤
│                QUESTIONS?                    │  ← FAQ accordion
├─────────────────────────────────────────────┤
│               TRY IT NOW                     │  ← Signup CTA
├─────────────────────────────────────────────┤
│                   FOOTER                     │
└─────────────────────────────────────────────┘
```

---

## Template 5: "Personal" (Be Known)

**Everyday name:** *The Personal*  
**What it's for:** Building your personal brand, growing an audience  
**Who it's for:** Coaches, creators, speakers, thought leaders

### Zone Structure

```
┌─────────────────────────────────────────────┐
│                   NAVBAR                     │
├─────────────────────────────────────────────┤
│                                             │
│               HI, I'M [NAME]                 │  ← Photo + intro
│                                             │
├─────────────────────────────────────────────┤
│                 MY STORY                     │  ← Extended bio
├──────────────────────┬──────────────────────┤
│    LATEST CONTENT    │   FEATURED WORK      │  ← Blog/podcast/etc
├──────────────────────┴──────────────────────┤
│              WHERE I'VE BEEN                 │  ← Speaking, appearances
├─────────────────────────────────────────────┤
│                STAY IN TOUCH                 │  ← Newsletter + socials
├─────────────────────────────────────────────┤
│                   FOOTER                     │
└─────────────────────────────────────────────┘
```

---

## Template 6: "Shop" (Sell Stuff)

**Everyday name:** *The Shop*  
**What it's for:** Selling products (physical or digital)  
**Who it's for:** Small shops, creators with merch, digital product sellers

### Zone Structure

```
┌─────────────────────────────────────────────┐
│                   NAVBAR                     │  ← + Cart + Search
├─────────────────────────────────────────────┤
│                  FEATURED                    │  ← Hero product/promo
├─────────────────────────────────────────────┤
│                 CATEGORIES                   │  ← Shop by type
├─────────────────────────────────────────────┤
│                                             │
│                 PRODUCTS                     │  ← Product grid
│                                             │
├─────────────────────────────────────────────┤
│             CUSTOMERS SAY                    │  ← Reviews
├─────────────────────────────────────────────┤
│                   FOOTER                     │  ← Shipping, returns
└─────────────────────────────────────────────┘
```

---

## Template Summary

| # | Name | Tagline | Best For |
|---|------|---------|----------|
| 1 | **The Starter** | Launch & Grow | Signups, campaigns, launches |
| 2 | **The Creative** | Show Your Work | Portfolios, visual work |
| 3 | **The Pro** | Get Booked | Services, consulting, agencies |
| 4 | **The Builder** | Sell Your Product | SaaS, apps, digital products |
| 5 | **The Personal** | Be Known | Personal brand, creators |
| 6 | **The Shop** | Sell Stuff | E-commerce, merch, digital goods |

---

## Shared Rules

### Responsive Behavior

| Breakpoint | Full-width | Half | Quarter |
|------------|-----------|------|---------|
| Desktop (1280px+) | 12 cols | 6 cols | 3 cols |
| Tablet (768-1279px) | 12 cols | 6 cols | 6 cols |
| Mobile (<768px) | 12 cols | 12 cols | 12 cols |

### Zone Constraints

1. **Navbar & Footer** — Always locked (top/bottom)
2. **Hero** — Must be first content zone
3. **CTA zones** — Cannot be placed above content zones
4. Users can **reorder middle zones** within constraints

---

## Next: Component Library

Each zone uses specific **organisms** (component groups).  
→ See `component-library-spec.md`

---

## Related Documents

| Document | Description |
|----------|-------------|
| [README](./README.md) | Document index and quick reference |
| [Discovery Notes](./znapsite-template-system-discovery.md) | Original product vision |
| [Component Library](./component-library-spec.md) | Components that fill these templates |
| [Homepage Design](./znapsite-homepage-design.md) | "The Starter" template in action |
| [Free Components](./free-component-catalog.md) | Style variants available per zone |
