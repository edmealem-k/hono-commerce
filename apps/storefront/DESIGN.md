# Storefront Design Specification: Apple + Stripe Commerce System

This document specifies the design system for **`apps/storefront`** (Public Storefront, Product Catalog, Customer Cart, and Checkout).

**Master Sources of Truth**:

- **Product Experience & Catalog**: [`packages/ui/design-systems/apple.md`](../../packages/ui/design-systems/apple.md)
- **Checkout & Financial Conversion**: [`packages/ui/design-systems/stripe.md`](../../packages/ui/design-systems/stripe.md)  
  **Monorepo Design Architecture**: [`packages/ui/DESIGN.md`](../../packages/ui/DESIGN.md)

---

## 1. Aesthetic Charter & Philosophy

- **Design Archetype**: Photography-First Premium Retail (derived from **Apple**) with Financial-Grade Checkout Ergonomics (derived from **Stripe**).
- **Palette Rhythm**: Crisp white/cream canvas (`#f6f9fc` / `#ffffff`), rich dark ink (`#1d1d1f` / `#0d253d`), subtle hairline borders (`#e3e8ee`), electric indigo brand CTA (`#533afd`), and minimal ambient shadows.
- **Atmosphere**: Museum-grade product presentation. Edge-to-edge product photography, generous whitespace (`py-12` to `py-20`), zero distracting UI chrome, and high-trust frictionless checkout.

---

## 2. Storefront Component Architecture

All components compose Base UI primitives with Tailwind v4 semantic tokens:

1.  **Product Displays & Grid (Apple-Inspired)**:
    - Responsive Catalog: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8`
    - Product Cards: `bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group`
    - Photography Framing: `aspect-[4/5]` or `aspect-square` with edge-to-edge imagery, resting drop shadow under product renders, and subtle hover zoom (`group-hover:scale-103 transition-transform duration-500 ease-out`).
2.  **Typography & Storytelling**:
    - Primary UI Sans: `Plus Jakarta Sans` (`--font-sans`)
    - Editorial Headlines: `Lora` (`--font-serif`) for brand narrative banners and hero taglines.
    - Pricing & Numerics: Tabular figures with `font-mono text-base sm:text-lg font-semibold tracking-tight` to prevent layout jumps during cart operations.
3.  **Checkout & Cart Controls (Stripe-Inspired)**:
    - Primary CTA (Add to Cart, Checkout): Electric indigo button (`bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 text-sm font-semibold rounded-xl shadow-sm active:translate-y-px transition-all`).
    - Sticky Mobile Conversion: On screens `< 640px`, anchor "Add to Cart" / "Checkout" to the bottom viewport (`sticky bottom-0 pb-safe bg-background/95 backdrop-blur-md border-t border-border p-4`).
4.  **Touch Targets**:
    - All clickable product cards, quantity steppers, thumbnail switches, and cart buttons must maintain $\ge 44\times 44\text{px}$ touch targets.

---

## 3. Mandatory Invariants

- **Base UI `render` prop**: Never use Radix `asChild`. Always use `render={<Link ... />}` or `render={<button ... />}`.
- **6-State Matrix**: Every storefront screen and cart slider must handle _Initial, Loading (shimmer skeletons), Success (order confirmation), Empty (empty cart with shop CTA), Error, and Out of Stock/Expired_.
