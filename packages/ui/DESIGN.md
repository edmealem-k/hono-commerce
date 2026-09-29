# Hono Commerce Design System Specification (DESIGN.md)

This document is the **single source of truth** for visual identity, design tokens, component styling, and UX patterns across the `hono-commerce` monorepo. All frontend applications (`apps/dashboard`, `apps/storefront`, and `@hono-commerce/ui`) must adhere strictly to these guidelines.

---

## 1. Visual Theme & Dual Brand Architecture

Hono Commerce balances two distinct frontend experiences governed by dedicated brand specifications:

- **Merchant & Admin Portal (`apps/dashboard`)**:
  - **Source of Truth**: [`packages/ui/design-systems/shopify.md`](../../packages/ui/design-systems/shopify.md) & [`apps/dashboard/DESIGN.md`](../../apps/dashboard/DESIGN.md)
  - **Aesthetic**: **Shopify Commerce Admin**. Merchant-first, high-density commerce cockpit, high-contrast fulfillment tags (_Paid_, _Unfulfilled_, _Refunded_), inventory alert badges, GMV metric cards, and clean 1px hairline dividers.
  - **Density**: High information density. Compact headers, structured metric tiles, clean tabular grids, and subtle background elevation.

- **Public Storefront & Customer Portal (`apps/storefront`)**:
  - **Source of Truth**: [`packages/ui/design-systems/apple.md`](../../packages/ui/design-systems/apple.md) & [`packages/ui/design-systems/stripe.md`](../../packages/ui/design-systems/stripe.md) & [`apps/storefront/DESIGN.md`](../../apps/storefront/DESIGN.md)
  - **Aesthetic**: **Apple + Stripe Commerce System**. Photography-first museum-grade product presentation, generous whitespace, zero UI chrome distraction, tabular pricing figures, electric indigo primary CTAs, and frictionless checkout ergonomics.
  - **Density**: Comfortable and breathable. High-contrast typography, large touch targets ($\ge 44\text{px}$), and sticky mobile conversion bars.

---

## 2. Color Palette & Semantic Roles (OKLCH)

All colors are defined via Tailwind CSS v4 variables in `packages/ui/src/styles/globals.css`. **Never use arbitrary raw hex codes or inline styles.**

| Token                | Semantic Role                        | Light Mode Value                                | Dark Mode Value                                    |
| :------------------- | :----------------------------------- | :---------------------------------------------- | :------------------------------------------------- |
| `--background`       | Page background                      | `oklch(0.9232 0.0026 48.7)` (Warm off-white)    | `oklch(0.2244 0.0074 67.4)` (Deep neutral slate)   |
| `--card`             | Elevated surface / Card / Drawer     | `oklch(0.9699 0.0013 106.4)` (Pure crisp white) | `oklch(0.2801 0.008 59.3)` (Layered dark slate)    |
| `--foreground`       | Primary text                         | `oklch(0.2795 0.0368 260.0)`                    | `oklch(0.9288 0.0126 255.5)`                       |
| `--muted`            | Subdued surface (table rows, inputs) | `oklch(0.9232 0.0026 48.7)`                     | `oklch(0.2287 0.0074 67.4)`                        |
| `--muted-foreground` | Secondary labels, timestamps         | `oklch(0.551 0.0234 264.4)`                     | `oklch(0.7137 0.0192 261.3)`                       |
| `--primary`          | Main brand CTA / Focus ring / Glow   | `oklch(0.5854 0.2041 277.1)` (Electric Indigo)  | `oklch(0.6801 0.1583 276.9)` (Vibrant Violet-Blue) |
| `--border`           | 1px surface borders & dividers       | `oklch(0.8687 0.0043 56.4)`                     | `oklch(0.3359 0.0077 59.4)`                        |
| `--destructive`      | Errors, warnings, delete actions     | `oklch(0.6368 0.2078 25.3)` (Rose)              | `oklch(0.6368 0.2078 25.3)` (Rose)                 |

### Status Colors (`StatusPill` / `WorkspaceHeroLayout`)

- **Success (Emerald)**: `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20`
- **Warning (Amber)**: `bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20`
- **Destructive (Rose)**: `bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20`
- **Info (Blue)**: `bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20`
- **Primary (Indigo)**: `bg-primary/10 text-primary border-primary/20`

---

## 3. Typography Rules

- **Primary Sans (`--font-sans`)**: `Plus Jakarta Sans, sans-serif`
  - Used for all UI, headings, buttons, and navigation.
  - Weights: `font-medium` (500) for body, `font-semibold` (600) for cards and buttons, `font-bold` (700) for page titles.
- **Monospace (`--font-mono`)**: `Roboto Mono, monospace`
  - Used for monetary values (`$1,240.00`), order IDs (`#ORD-9021`), slugs, API keys, and tracking codes.
- **Editorial Serif (`--font-serif`)**: `Lora, serif`
  - Reserved exclusively for editorial storefront storytelling (e.g. brand highlights, hero taglines).
- **Scale Hierarchy**:
  - `text-xs` (11-12px): Badges, timestamps, status pills, table headers.
  - `text-sm` (13-14px): Standard dashboard body, form labels, table cells, secondary buttons.
  - `text-base` (15-16px): Storefront body, standard inputs, card headings.
  - `text-lg` to `text-xl` (18-20px): Section headers, modal titles.
  - `text-2xl` to `text-4xl` (24-36px): Page titles, hero statements, KPI metrics.

---

## 4. Component Stylings & Patterns

All components are built on top of **Base UI primitives** (`@base-ui/react`) and styled with Tailwind CSS.

### A. Buttons (`@hono-commerce/ui/components/button`)

- **Composition**: Always use `render={<Link ... />}` or `render={<a ... />}`. **Never use Radix `asChild`.**
- **Sizes**:
  - `xs` (`h-6`, 11px font): Table inline actions, tag removal.
  - `sm` (`h-7`, 12px font): Standard dashboard toolbar buttons, filter chips.
  - `default` (`h-8`, 13px font): Standard dashboard CTAs, card actions.
  - `lg` (`h-10`, 15px font): Storefront hero CTAs, checkout triggers.
- **Micro-interaction**: `active:not-aria-[haspopup]:translate-y-px` for tactile mechanical click response.

### B. Cards & Surfaces

- **Dashboard Cards**: `bg-card border border-border/80 rounded-lg p-5 shadow-xs`
- **Auth & Modal Cards**: Centered container `max-w-md w-full bg-card/95 backdrop-blur-md border border-border rounded-xl p-6 sm:p-8 shadow-md`
- **Hoverable Interactive Cards**: `hover:border-primary/40 hover:shadow-sm transition-all duration-150`

### C. Form Controls (`Input`, `Select`, `Textarea`)

- **Input Height**: Match button heights (`h-8` for dashboard, `h-10` for storefront).
- **Focus Ring**: `focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 outline-none`.
- **Validation**: When `aria-invalid="true"`, apply `border-destructive ring-1 ring-destructive/20 text-destructive`.

---

## 5. Layout Principles & Spacing

- **Spacing Grid**: Incremental multiples of 4px/8px: `gap-1.5` (6px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px).
- **Max Widths**:
  - Auth & Token Cards: `max-w-md` (448px).
  - Dashboard Content: `max-w-7xl` or full-width fluid with `px-4 sm:px-6 lg:px-8`.
  - Storefront Containers: `max-w-6xl` centered (`mx-auto`).
- **Split Panels & Drawers**:
  - Utilize `@hono-commerce/ui/shared/split-view` for deep inspectors and live previews.
  - Utilize `@hono-commerce/ui/shared/drawer` for bottom sheets and stacked wizards.

---

## 6. Depth & Elevation

Depth is created via **border illumination and layered backgrounds**, not muddy dropshadows:

- **Layer 0 (Canvas)**: `bg-background`
- **Layer 1 (Card/Table)**: `bg-card border border-border`
- **Layer 2 (Popover/Dropdown/Drawer)**: `bg-popover border border-border/90 shadow-md`
- **Layer 3 (Modal Dialog/Alert)**: `bg-card border border-border shadow-xl backdrop-blur-sm`
- **Ambient Glows**: Used selectively on hero sections and active status icons (`bg-primary/10 blur-xl`).

---

## 7. Mandatory Do's & Don'ts

| Do                                                                                                     | Don't                                                                      |
| :----------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| **DO** compose Base UI primitives with `render={<... />}`.                                             | **DON'T** import or write `asChild` (Radix pattern is banned).             |
| **DO** explicitly handle all 6 UI lifecycle states (Initial, Loading, Success, Empty, Error, Expired). | **DON'T** leave blank empty screens or endless generic loading spinners.   |
| **DO** use semantic tokens (`bg-card`, `text-muted-foreground`).                                       | **DON'T** write arbitrary colors (`bg-[#18181b]`, `text-gray-400`).        |
| **DO** use `lucide-react` with consistent sizing (`size-4`).                                           | **DON'T** use emojis as functional UI icons.                               |
| **DO** preserve $\ge 44\text{px}$ touch targets on mobile.                                             | **DON'T** render tiny, unclickable action links on touch screens.          |
| **DO** put composite application widgets into `packages/ui/src/shared/*`.                              | **DON'T** pollute `packages/ui/src/components/*` with domain-coupled code. |

---

## 8. Responsive Behavior

- **Mobile-First Touch Ergonomics**:
  - On screens `< 640px`, actions stick to the bottom viewport (`sticky bottom-0 pb-safe`).
  - Complex data tables degrade to card layouts or scroll horizontally with visual fade indicators.
- **Desktop Multi-Column**:
  - Collapsible left navigation + responsive content sidebar (`ResponsiveContentSidebarLayout`).

---

## 9. AI Agent Prompting Invariant

When instructed to generate, style, or refactor any frontend code:

1. Always consult this document (`packages/ui/DESIGN.md`) for tokens and hierarchy.
2. Activate `.agents/skills/ui-ux-pro-max` for accessibility and micro-interaction checks.
3. Ensure every form and mutation component implements clear optimistic or pending feedback.
4. Verify complete code quality and TypeScript adherence with `bun run verify` before submitting.
