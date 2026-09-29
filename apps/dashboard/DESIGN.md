# Dashboard Design Specification: Shopify-Inspired Commerce Admin

This document specifies the design system for **`apps/dashboard`** (Merchant Store Management and Platform Superadmin Portals).

**Master Source of Truth**: [`packages/ui/design-systems/shopify.md`](../../packages/ui/design-systems/shopify.md)  
**Monorepo Design Architecture**: [`packages/ui/DESIGN.md`](../../packages/ui/DESIGN.md)

---

## 1. Aesthetic Charter & Philosophy

- **Design Archetype**: Merchant-First Commerce Cockpit (derived from **Shopify Polaris** and modern commerce operators).
- **Palette Rhythm**: Clean high-contrast canvas (`bg-background` off-white / dark slate), elevated white/charcoal cards (`bg-card`), crisp hairline dividers (`border-border`), and vibrant commerce status tones (aloe/emerald for paid orders, amber for inventory alerts, electric indigo for primary actions).
- **Atmosphere**: Purpose-built for high-volume store operations. Low cognitive friction, instant order status readability, clear financial figures, and zero distracting decoration.

---

## 2. Dashboard Component Architecture

All components compose Base UI primitives with Tailwind v4 semantic tokens:

1.  **Commerce Surfaces & Cards**:
    - Main canvas: `bg-background`
    - Store Management Cards: `bg-card border border-border/80 rounded-lg p-5 shadow-xs`
    - Hoverable rows / cards: `hover:border-primary/40 hover:bg-muted/30 transition-all duration-150`
2.  **Order & Inventory State Badges (`StatusPill`)**:
    - **Paid / Fulfilled**: `StatusPill tone="success" dot={true}` (Emerald / Mint)
    - **Pending / In Review / Low Stock**: `StatusPill tone="warning" dot={true}` (Amber)
    - **Cancelled / Refunded / Out of Stock**: `StatusPill tone="destructive" dot={true}` (Rose)
    - **Processing / In Transit**: `StatusPill tone="info" dot={true}` (Blue)
    - **Draft / Archived**: `StatusPill tone="muted"` (Muted Gray)
3.  **Typography & Financial Data**:
    - Font family: `Plus Jakarta Sans` (`--font-sans`)
    - Monospace Numerics: `Roboto Mono` (`--font-mono`) for all monetary amounts (`$1,420.50`), SKU codes (`SKU-BLK-MD`), order references (`#ORD-1092`), and tenant slugs.
    - Scale: Compact dashboard density. Section headings 18-20px (`font-semibold`), table cells 13-14px (`font-medium`), status pills 11-12px (`font-semibold`).
4.  **Buttons & Toolbars**:
    - Primary CTA (Save, Add Product, Fulfill): `bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs font-semibold rounded-md shadow-xs active:translate-y-px`
    - Secondary Actions (Export, Filter, More): `bg-secondary hover:bg-muted border border-border h-8 px-3 text-xs rounded-md`
    - Destructive Actions (Archive, Delete): `bg-destructive/10 text-destructive hover:bg-destructive/20 h-8 px-3 text-xs`

---

## 3. Mandatory Invariants

- **Base UI `render` prop**: Never use Radix `asChild`. Always use `render={<Link ... />}` or `render={<button ... />}`.
- **6-State Matrix**: Every dashboard view, form, and table must handle _Initial, Loading (skeletons), Success, Empty (`EmptyState`), Error, and Expired_.
