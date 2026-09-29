# UI/UX Quick Reference & Guidelines

Comprehensive checklists and rules for building UI in `hono-commerce`.

---

## 1. Accessibility (Critical - WCAG AA)

- **Color Contrast**: Minimum 4.5:1 ratio for normal body text; minimum 3:1 for large text (18px+ bold or 24px+ normal) and interactive border elements.
- **Focus States**: Never disable focus rings (`outline: none` without replacement). Always provide `focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none`.
- **Keyboard Navigation**: Natural tab order (DOM order matches visual layout). Modal dialogs and drawers must trap focus and release focus back to trigger upon close.
- **Icon Buttons**: Every icon-only button must have an explicit `aria-label` or visually hidden text (e.g. `<Button aria-label="Close dialog"><X className="size-4" /></Button>`).
- **Form Labels**: Always associate `<Label htmlFor={id}>` with input IDs. Never rely on placeholders as the only label.
- **Accessible Authentication**: Support copy-pasting into password/OTP fields; never block autofill or password managers.

---

## 2. Touch & Micro-Interactions

- **Touch Target Sizing**: Minimum 44×44px interactive area for all buttons, links, and switches on mobile devices.
- **Touch Spacing**: Minimum 8px spacing between adjacent touch targets to prevent accidental mis-taps.
- **Instant Press Feedback**: Interactive components should show active feedback (`active:translate-y-px` or subtle opacity change) within 100ms.
- **Asynchronous Button States**: When a button triggers an async mutation (e.g. "Save", "Accept Invitation"), disable the button, show a spinner, and retain the original button width to prevent layout shift.
- **Safe Area Insets**: Floating action buttons, bottom bars, and mobile drawers must respect `pb-safe` / `env(safe-area-inset-bottom)`.

---

## 3. Visual Hierarchy & Spacing

- **4px / 8px Spacing System**:
  - `p-1` (4px), `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px), `p-8` (32px).
- **Dashboard Density (`apps/dashboard`)**:
  - Compact padding (`py-1.5 px-3` for table cells and form controls).
  - Subtle 1px borders (`border border-border/60`).
  - Monospace font (`font-mono text-xs`) for slugs, UUIDs, SKUs, and numerical identifiers.
  - Subdued background hierarchy: Page (`bg-background`) $\to$ Cards (`bg-card`) $\to$ Inputs/Tables (`bg-muted/30` or `bg-background`).
- **Storefront Immersion (`apps/storefront`)**:
  - Generous vertical padding (`py-12` to `py-20` on sections).
  - Rich typography pairings: `Plus Jakarta Sans` for clean sans UI, `Lora` for editorial storytelling where applicable.
  - Sticky bottom action bars on mobile viewports for "Add to Cart" and "Checkout".

---

## 4. Forms & User Feedback

- **Inline Validation**: Place error text immediately below the relevant field, paired with `aria-invalid="true"`.
- **Error Tone**: Use calm, actionable copy. Never blame the user.
  - *Bad*: "Invalid input."
  - *Good*: "Enter a valid email address (e.g. name@domain.com)."
- **Empty States**: Never display a blank empty table or blank list. Always render an `EmptyState` component with:
  1. An illustrative icon (from `lucide-react`).
  2. A concise heading ("No products found").
  3. A supporting sentence ("Get started by creating your first product.").
  4. A primary CTA button ("Create Product").

---

## 5. Motion & Transitions

- **Duration Tokens**:
  - Instant micro-actions (hover, active, focus): `100ms - 150ms ease-out`.
  - Drawers, dropdowns, and dialogs: `200ms - 250ms ease-out`.
  - Page-level transitions: `300ms ease-in-out`.
- **Performance**: Animate only `transform` and `opacity`. Never animate `height`, `width`, or `margin` directly.
- **Reduced Motion**: Always honor `prefers-reduced-motion: reduce`.
