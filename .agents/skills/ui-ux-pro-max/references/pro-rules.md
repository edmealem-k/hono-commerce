# Pro Rules & Pre-Delivery Audit

Detailed checklist and anti-patterns for professional UI in `hono-commerce`.

---

## 1. Icon Discipline

| Rule | Requirement | Anti-Pattern to Avoid |
| :--- | :--- | :--- |
| **No Emojis as UI Controls** | Use `lucide-react` vector icons for all buttons, menus, and navigation tabs. | Using emojis (🚀, ⚙️, 📦) in buttons or sidebar items. |
| **Consistent Stroke & Sizing** | Default to `size-4` (16px) or `size-5` (20px) with `stroke-[1.5]` or `stroke-[1.75]`. | Mixing tiny 12px icons with bulky 28px icons on the same row. |
| **Semantics & Contrast** | Meaningful icons must have $\ge 3:1$ contrast against background; decorative icons must be `aria-hidden="true"`. | Unlabeled icon-only buttons or invisible low-contrast icons. |

---

## 2. Component State Matrix

Every high-level card, form, or workspace view must explicitly handle all 6 lifecycle states:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          COMPONENT STATE MATRIX                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. INITIAL     │ Clean resting state, default placeholder/values       │
│ 2. LOADING     │ Shimmer skeleton or spinner with informative text     │
│ 3. SUCCESS     │ Subtle confirmation banner or StatusPill (emerald)    │
│ 4. EMPTY       │ EmptyState component with actionable CTA button       │
│ 5. ERROR       │ Inline recovery alert with retry button (rose)        │
│ 6. EXPIRED     │ Desaturated view with single-click refresh CTA        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dark Mode & Contrast Guardrails

- **Card Elevation in Dark Mode**:
  - In dark mode, do not rely exclusively on drop shadows (which disappear on black backgrounds).
  - Use subtle 1px border highlights (`border-border` / `border-white/10`) and background lightness steps (`bg-card` vs `bg-background`).
- **Muted Text Contrast**:
  - `text-muted-foreground` must remain readable on both `bg-background` and `bg-card`.
  - Avoid stacking multiple opacity classes (e.g. `text-muted-foreground/50` on `bg-muted`) that drop contrast below 4.5:1.

---

## 4. Mobile Ergonomics & Breakpoints

- Breakpoint discipline:
  - Mobile: `< 640px` (`sm`)
  - Tablet: `640px - 1024px` (`md`, `lg`)
  - Desktop: `> 1024px` (`xl`, `2xl`)
- On mobile viewports:
  - Tables collapse or convert to swipeable/card lists.
  - Desktop sidebars transform into bottom sheets or slide-over drawers via `@hono-commerce/ui/shared/drawer`.
  - Primary actions (Checkout, Save, Next) anchor to sticky bottom containers with safe-area padding.
