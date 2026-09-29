---
name: ui-ux-pro-max
description: UI/UX design intelligence and design system compliance for hono-commerce. Use when designing, building, reviewing, or styling UI components, pages, dashboard views, storefronts, modal dialogs, cards, forms, and responsive layouts.
metadata:
  author: nextlevelbuilder
  adapted_for: hono-commerce
  version: "2.15.0"
---

# UI/UX Pro Max - Design Intelligence for Hono Commerce

This skill provides design reasoning, spacing logic, state modeling, and visual quality rules for all frontend applications in the `hono-commerce` monorepo (`apps/dashboard`, `apps/storefront`, and `@hono-commerce/ui`).

---

## 1. When to Apply

Use this skill whenever you are:
- **Designing or implementing new pages/views** (e.g. public auth, checkout, product catalog, merchant admin).
- **Creating or refactoring UI components** in `packages/ui` or app-level feature components.
- **Formulating component states**: loading spinners/skeletons, empty states, validation errors, success confirmations.
- **Auditing accessibility & ergonomics**: WCAG AA contrast, touch targets, keyboard navigation, focus indicators.
- **Tuning responsiveness**: desktop density vs. mobile ergonomics.

Skip for: pure backend logic (`apps/api`), database schemas (`packages/db`), background workers (`apps/worker`), or non-visual utility scripts.

---

## 2. Monorepo UI Invariants (Mandatory)

Always adhere to the repo rules defined in `AGENTS.md` and `packages/ui/DESIGN.md`:

1. **Base UI Composition (`render` Prop)**:
   - `@hono-commerce/ui` uses `@base-ui/react`.
   - **NEVER** use Radix's `asChild` prop.
   - Always compose links or custom elements with the `render` prop:
     ```tsx
     <Button render={<Link href="/login" />}>Sign In</Button>
     ```
2. **Atomic vs. Composite Separation**:
   - Atomic base primitives stay in `packages/ui/src/components/*` (`button.tsx`, `input.tsx`, `card.tsx`).
   - Composite domain widgets live in `packages/ui/src/shared/*` (`dashboard/status-pill.tsx`, `dashboard/workspace-hero-layout.tsx`, `data-table/*`).
3. **Tailwind CSS v4 & OKLCH Semantic Tokens**:
   - Never hardcode arbitrary hex colors (e.g. `#1e293b` or `#6366f1`) in UI components.
   - Always use semantic tokens mapped in `packages/ui/src/styles/globals.css`:
     `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`.
4. **Mandatory 6-State Matrix**:
   - For every interactive card, page, or form, explicitly handle all 6 states:
     1. **Initial / Pristine**: Clean resting state.
     2. **Loading**: Skeletons or subtle spinners with reassuring microcopy (prevent CLS).
     3. **Success**: Clear confirmation badge or status pill (`StatusPill` with `tone="success"`).
     4. **Empty**: Engaging zero-data empty state with an actionable CTA button (`EmptyState`).
     5. **Error**: Inline, empathetic error message near the offending element + recovery CTA.
     6. **Disabled / Expired**: Clearly desaturated, distinct from loading, with helpful explanation (e.g. "Link expired — click below to resend").

---

## 3. Priority Rules for Design Decision-Making

Follow this priority order when making visual or structural decisions:

| Priority | Category | Key Checks | Anti-Patterns to Avoid |
| :--- | :--- | :--- | :--- |
| **1** | **Accessibility (WCAG AA)** | Minimum 4.5:1 text contrast; keyboard focus rings (`focus-visible:ring-1 focus-visible:ring-ring`); icon-only buttons have `aria-label`. | Low-contrast gray text; removing outline focus rings; unlabelled icon buttons. |
| **2** | **Touch & Target Sizing** | Min touch target 44×44px on mobile; spacing between touch targets $\ge 8\text{px}$. | Tiny 20px clickable text on mobile screens. |
| **3** | **Visual Hierarchy & Density** | Dashboards use high density (compact paddings `py-1.5`, 12-14px font); Storefronts use generous breathing room (`py-12`, 16-18px body). | Cluttered headers; low contrast section divisions; wall of text without scanning anchors. |
| **4** | **Forms & Inputs** | Labels visible above inputs; inline error summaries; password visibility toggles; keyboard navigation tab index. | Floating placeholder-only labels; alert dialogs for field-level errors. |
| **5** | **Micro-interactions & Physics** | Fast, subtle transitions (`150ms ease-out`); button active press effect (`active:translate-y-px`); reduced-motion support. | Jerky 500ms transitions; animating `width`/`height` directly instead of `transform`/`opacity`. |

---

## 4. Pre-Delivery Checklist for Any UI Change

Before concluding any UI task, run this mental audit:
- [ ] Are all colors using semantic Tailwind tokens from `globals.css`?
- [ ] Does the UI render cleanly in both Light Mode and Dark Mode?
- [ ] Is there an obvious, natural tab order with visible `focus-visible` rings?
- [ ] Are loading and error states rendered gracefully without jumping content (CLS)?
- [ ] Did I avoid Radix `asChild` and correctly use Base UI's `render` prop?
- [ ] Does `bun run verify` pass with 0 warnings and 0 errors?

---

## 5. Detailed References

For full guideline specifications and fine-grained patterns, see:
- [`references/quick-reference.md`](file:///home/edmealem.k/Downloads/hono-commerce/.agents/skills/ui-ux-pro-max/references/quick-reference.md) — 119 UX rules, form patterns, and accessibility standards.
- [`references/pro-rules.md`](file:///home/edmealem.k/Downloads/hono-commerce/.agents/skills/ui-ux-pro-max/references/pro-rules.md) — Polish rules, safe areas, and mobile ergonomics.
- [`packages/ui/DESIGN.md`](file:///home/edmealem.k/Downloads/hono-commerce/packages/ui/DESIGN.md) — Design tokens, typography scales, and brand identity.
