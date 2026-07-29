# GeePay Marketplace Design System Guide

## Building Consistent, High-End Interfaces for the GeePay E-Commerce Marketplace

> **Default theme**: GeePay Cobalt (`#383d92`) · Sky Blue (`#00afeb`)
> **Surface philosophy**: Dark ambient sidebar · flat content surfaces · **flat CTAs** · selective chart / brand gradients · premium surface layer on branded moments
>
> **Marketplace delta vs NFS Proxy**: Primary buttons are **flat cobalt** — never use gradients on buttons. Brand gradients remain for text fills, seams, chart fills, and hover accents on non-button surfaces.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Tailwind Config](#tailwind-config)
3. [CSS Variables (`index.css`)](#css-variables-indexcss)
4. [Typography](#typography)
5. [Color System](#color-system)
6. [Interactive Control Language](#interactive-control-language)
7. [Animation Guidelines](#animation-guidelines)

---

## Design Philosophy

### Core Principles

- **Commerce Confidence** — Every screen must communicate precision, trust, and control. Merchants move real money and real inventory. Visual noise or cheapness are liabilities.
- **Premium Restraint** — Gradients and depth create quality, not spectacle. Flat surfaces stay flat unless elevation carries meaning. **Buttons stay flat cobalt.**
- **Hierarchy That Earns Its Place** — Typography, weight, and spacing do the heavy lifting. Color amplifies hierarchy; it does not substitute for it.
- **Ambient Depth on Dark Surfaces** — The portal sidebar is the product's anchor. It uses a layered atmospheric gradient — not a flat color — via `sidebar-ambient`.
- **Data Legibility First** — Charts and order tables are financial instruments. Gradients never obscure values.
- **Brand Lives on Every Surface** — Cobalt→sky appears as gradient-kissed borders, shimmer sweeps, text fills on key moments, and glow on featured cards — not on primary buttons.

### Target Aesthetic

High-end modern fintech commerce — Stripe Atlas / Shopify admin calibrated for the Zambian market. Confident white content areas, ambient navy→cobalt sidebar, flat cobalt primary actions, signature brand gradient reserved for H1/KPI text and structural chrome.

---

## Tailwind Config

Source of truth: `geepay-ecom-frontend/tailwind.config.js`

| Token family | Classes |
|---|---|
| Brand (canonical) | `gp-cobalt-*`, `gp-sky-*`, `gp-navy-*`, `gp-slate-*` |
| Brand (aliases) | `cobalt-*`, `sky-*`, `navy-*` — keep working for existing JSX |
| Legacy | `forest`, `cream`, `sage`, `charcoal` → mapped to brand |
| Display font | `font-display` (DM Sans); `font-serif` aliases to display |
| Body font | `font-sans` (Inter) |
| Mono | `font-mono` (JetBrains Mono) |
| Type scale | `text-display-{2xl…xs}`, `text-text-{xl…xs}` |
| Brand gradient bg | `bg-brand-gradient` — **not for buttons** |

---

## CSS Variables (`index.css`)

Key utilities:

| Utility | Use |
|---|---|
| `sidebar-ambient` | Portal sidebar / auth brand panel background |
| `sidebar-seam` | Cobalt→sky edge seam on sidebar |
| `text-gradient-brand` | Page titles (H1) only |
| `text-gradient-stat` | KPI / stat numbers only |
| `shimmer-surface` | Hover shimmer on flat CTAs & branded cards |
| `card-glow` | Featured metric cards |
| `border-gradient` | Soft brand border on featured panels |
| `nav-glow-dot` | Active nav live indicator |
| `table-header-rule` | Cobalt→sky rule under table headers |
| `progress-bar-gradient` | Progress indicators (not buttons) |
| `auth-sign-in-btn` | Flat cobalt auth CTA |

---

## Typography

### Font Choices

| Role | Font | Why |
|---|---|---|
| **Headings / Display / Stats** | **DM Sans** | Geometric, confident. Premium without cold. |
| **Body / UI / Tables** | **Inter** | UI legibility at 12–14px. |
| **IDs / Amounts / Timestamps** | **JetBrains Mono** | Order refs, balances, hashes align in tables. |

> `font-serif` is retained as an alias of `font-display` so existing storefront / portal headings pick up DM Sans without a mass rename.

### Usage Rules

```tsx
// ✅ Page title — DM Sans + gradient text fill
<h1 className="font-display font-bold text-display-sm text-gradient-brand">
  Orders
</h1>

// ✅ Section heading — DM Sans, semibold, gray (no gradient)
<h2 className="font-display font-semibold text-display-xs text-gray-800">
  Today's sales
</h2>

// ✅ Stat / KPI number — DM Sans, bold + gradient text
<span className="font-display font-bold text-display-md text-gradient-stat tabular-nums">
  K 2,481,350.00
</span>

// ✅ Body — Inter
<p className="font-sans text-text-md text-gray-500">
  Payments settle to your Geepay wallet after confirmation.
</p>

// ✅ Order ID / timestamp — JetBrains Mono
<span className="font-mono text-text-xs text-gray-400">
  ORD-20260412-009182
</span>

// ✅ Amount in table — JetBrains Mono
<span className="font-mono text-text-sm font-medium text-gray-900 tabular-nums">
  K 48,200.00
</span>

// ❌ Never use font-sans for page headings
// ❌ Never use font-display for body / table / inputs
// ❌ Never use gradient text on section headings (H2+) — H1 and KPI stats only
// ❌ Never use gradients on buttons
```

### Hierarchy at a Glance

```
font-display text-display-sm font-bold  + text-gradient-brand  → Page title (H1)
font-display text-display-xs font-semibold  text-gray-800      → Section title (H2)
font-display text-text-xl    font-semibold  text-gray-900      → Card/modal title (H3)
font-display text-display-md font-bold  + text-gradient-stat   → KPI stat numbers
font-sans    text-text-md    font-normal    text-gray-500       → Body / description
font-sans    text-text-sm    font-medium    text-gray-700       → Labels, table headers
font-sans    text-text-xs    font-normal    text-gray-400       → Captions, helper text
font-mono    text-text-sm    tabular-nums   text-gray-900       → Currency amounts (tables)
font-mono    text-text-xs    font-normal    text-gray-400       → IDs, timestamps, hashes
```

---

## Color System

### Three Layers — Never Break This Hierarchy

```
LAYER 1 — GeePay brand (gp-cobalt, gp-sky, gp-navy)
           Sidebar accent, flat CTAs, gradient borders, gradient text,
           glow, shimmer, badges, chart fills, focus rings, active nav.

LAYER 2 — Semantic (success / warning / danger / info)
           Status badges, alerts, order / payment outcomes.
           Never used as decoration or branding.

LAYER 3 — Neutral (gp-slate-* / gray-*)
           Content surfaces, table rows, borders, muted text.
           Dominant by surface area.
```

### Brand Color Reference

```tsx
'bg-gp-cobalt'           // #383d92 — flat primary buttons
'bg-gp-cobalt-100'       // badge backgrounds
'text-gp-cobalt'         // cobalt text on white
'border-gp-cobalt-300'   // subtle cobalt border

'bg-gp-sky'              // #00afeb — live indicators
'bg-gp-sky-100'          // active highlights
'text-gp-sky-600'        // readable sky on white
'border-gp-sky'          // focus ring accent

'bg-gp-navy'             // #080C30 — only when not using sidebar-ambient
```

### Flat Primary CTA

```tsx
// ✅ Correct — flat cobalt + optional shimmer
<button className="bg-gp-cobalt text-white shadow-btn-flat shimmer-surface rounded-xl …">
  Save changes
</button>

// Or use the shared Button component (primary variant)
<Button variant="primary">Save changes</Button>

// ❌ Never
<button className="bg-brand-gradient …">…</button>
<button className="btn-gradient …">…</button>
```

---

## Interactive Control Language

Import springs from `@/lib/motion`.

### Principle 1 — Spring Physics on Interactive Elements

| Element type | `whileHover` | `whileTap` | Spring |
|---|---|---|---|
| Primary CTA (flat) | `scale: 1.02` | `scale: 0.97` | stiffness:500 damping:30 |
| Secondary / outline | `scale: 1.01` | `scale: 0.98` | stiffness:500 damping:30 |
| Icon-only toolbar | `scale: 1.10` | `scale: 0.88` | stiffness:500 damping:30 |
| Labeled toolbar | `scale: 1.04` | `scale: 0.94` | stiffness:500 damping:30 |
| Navigable card | `y: -3` | `scale: 0.99` | stiffness:400 damping:28 |
| Inline icon (table) | `scale: 1.15` | `scale: 0.85` | stiffness:600 damping:32 |
| Selectable row | `x: 2` | — | stiffness:400 damping:30 |
| Sidebar nav item | `x: 3` | — | stiffness:400 damping:30 |

### Principle 2 — Elevation as the Selection Signal

```
Level 0 — bg-gray-50/80            Resting control tray, input background
Level 1 — bg-white + shadow-sm     Active pill, focused input, hovered control
Level 2 — bg-white + shadow-md     Card resting, dropdown, popover
Level 3 — bg-white + shadow-lg     Modal, side sheet, drawer
Level 4 — bg-white + shadow-2xl    Full-screen overlay
```

### Principle 3 — Color Restraint on Chrome Controls

| Surface | Color rule |
|---|---|
| Inactive toolbar control | `text-gray-400` |
| Active toolbar control | `text-gray-900` + elevation |
| Active count badge | `bg-gp-cobalt` |
| Primary CTA | flat `bg-gp-cobalt` + `shimmer-surface` |
| Selected nav item | `bg-gp-sky/12 text-gp-sky` + `nav-glow-dot` |
| Status indicators | Semantic tokens only |

### Toolbar Controls — Frosted Pill Surface

```tsx
import { motion } from 'framer-motion'
import { springs } from '@/lib/motion'

<motion.div className="flex bg-slate-50/80 p-1 rounded-xl gap-0.5">
  {options.map((opt) => (
    <motion.button
      key={opt.value}
      onClick={() => setValue(opt.value)}
      className={`relative h-9 px-3 rounded-lg text-text-sm font-medium outline-none
                  transition-colors duration-150
                  ${value === opt.value ? 'text-gray-900' : 'text-gray-400'}`}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      transition={springs.labeledToolbar}
    >
      {value === opt.value && (
        <motion.span
          layoutId="activeTogglePill"
          className="absolute inset-0 bg-white rounded-lg shadow-sm"
          transition={springs.pill}
        />
      )}
      <span className="relative z-10">{opt.label}</span>
    </motion.button>
  ))}
</motion.div>
```

---

## Animation Guidelines

### Page Transition

```tsx
import { PageTransition } from '@/components/shared/PageTransition'

export function OrdersPage() {
  return (
    <PageTransition className="space-y-6">
      {/* page content */}
    </PageTransition>
  )
}
```

### Stagger Grid

```tsx
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/motion'

<motion.div variants={staggerContainer} initial="hidden" animate="visible"
            className="grid grid-cols-4 gap-4">
  {cards.map((card) => (
    <motion.div key={card.id} variants={staggerItem}>
      <MetricCard {...card} />
    </motion.div>
  ))}
</motion.div>
```

### Timing Standards

| Interaction | Duration | Easing |
|---|---|---|
| Page transition | 250ms | `[0.16, 1, 0.3, 1]` |
| Modal open/close | 200ms | `[0.16, 1, 0.3, 1]` |
| Dropdown / popover | 150ms | ease-out |
| Hover state | 150ms | ease-out |
| Stagger children | 60ms apart | `[0.16, 1, 0.3, 1]` |
| Skeleton shimmer | 1800ms | ease-in-out infinite |
| Active pill (layoutId) | spring | stiffness:400, damping:28 |
| Toolbar button hover/tap | spring | stiffness:500, damping:30 |
| Card shimmer sweep | 500ms | ease |
| Toggle icon rotation | 250ms | `[0.16, 1, 0.3, 1]` |
| Count badge scale-in | spring | stiffness:500, damping:25 |

---

## File Map

| Concern | Path |
|---|---|
| Tokens + utilities | `src/index.css` |
| Tailwind theme | `tailwind.config.js` |
| Fonts | `index.html` |
| Motion constants | `src/lib/motion.ts` |
| Page transition | `src/components/shared/PageTransition.tsx` |
| Button (flat primary) | `src/components/ui/button.tsx` |
| Portal sidebar | `src/components/portal/PortalLayout.tsx` |
