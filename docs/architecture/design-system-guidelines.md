# UI/UX Design System & Component Guidelines

**Theme Reference**: Claymorphism / Dark Slate & Indigo Palette  
**Design Tokens**: `packages/ui/src/styles/globals.css`  
**Component Library**: `@hono-commerce/ui` (60+ Shadcn / Base UI Primitives)

---

## 1. Visual Theme & Aesthetics (Claymorphism & Modern Dark Mode)

The platform UI is built on a soft, tactile, claymorphic dark aesthetic inspired by the design tokens configured in `packages/ui/src/styles/globals.css`:

### A. Surface Elevation & Depth

- **Canvas Background (`bg-background`)**: Deep, warm dark slate (`oklch(0.2244 0.0074 67.437)`).
- **Card & Panel Surfaces (`bg-card`)**: Elevated, smooth charcoal-slate surfaces (`oklch(0.2801 0.008 59.3379)`) with subtle borders (`border-border`) and soft diffuse drop shadows (`--shadow-md`, `--shadow-lg`).
- **Inset / Recessed Elements (`bg-muted` / `bg-secondary`)**: Inputs, search bars, and table headers use slightly recessed dark surfaces to give a tactile, 3D clay feel.

### B. Color Roles & Palette Tokens

- **Primary Accent (`bg-primary text-primary-foreground`)**: Soft, vibrant Indigo / Violet (`oklch(0.6801 0.1583 276.9349)` / `~#818cf8`) with high-contrast foreground text. Used for main CTAs, active tab pills, selected dates, and primary badges.
- **Secondary / Neutral (`bg-secondary text-secondary-foreground`)**: Used for secondary actions, filter buttons, and inactive chips.
- **Destructive (`bg-destructive text-destructive-foreground`)**: Crimson warning for cancel, refund, delete actions.
- **Muted Foreground (`text-muted-foreground`)**: Subtitles, helper text, and timestamps.
- **Chart Accents (`--chart-1` through `--chart-5`)**: Harmonious violet-to-cyan gradient scales for revenue, subscription, and analytics graphs.

### C. Shape & Radius

- **Default Radius (`--radius: 1.25rem` / `20px`)**: Generous, friendly rounded corners on cards (`rounded-2xl` / `rounded-3xl`), buttons (`rounded-xl`), inputs, and pills.

---

## 2. Component Usage Rules: Shadcn vs. Native HTML

> [!IMPORTANT]
> **Zero Raw HTML Inputs/Buttons Policy**: Never use raw, unstyled native HTML form controls (`<button>`, `<input>`, `<select>`, `<table>`, `<dialog>`). Always import and use the corresponding `@hono-commerce/ui` primitive.

### Form State and Data Mutation Standard

All frontend forms use React Hook Form with `@hookform/resolvers/zod` and a shared Zod schema from `packages/types/src/schemas/*`. Server-backed submissions use the typed Hono RPC client through TanStack Query mutations and invalidate the scoped query after success. The semantic `<form>` element may be used as the submission boundary, but raw form controls and ad-hoc request payloads are not allowed when a shared Base UI primitive exists.

### Mapping Table: What to Use

| Instead of Raw HTML...                 | ALWAYS Use `@hono-commerce/ui` Primitive                       | Reason & Benefit                                                                                                              |
| :------------------------------------- | :------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `<button>`                             | `<Button variant="..." size="...">`                            | Supports variants (`default`, `secondary`, `outline`, `ghost`, `destructive`), loading states, and consistent tactile radius. |
| `<input type="text\|email\|password">` | `<Input>` or `<InputGroup>`                                    | Standardized focus rings (`ring-primary`), validation borders, and icon affix slots.                                          |
| `<textarea>`                           | `<Textarea>`                                                   | Consistent styling, auto-expanding capabilities, and matching borders.                                                        |
| `<select>` / `<option>`                | `<Select>` or `<Combobox>`                                     | Fully accessible, keyboard-navigable, searchable custom popovers.                                                             |
| `<input type="checkbox">`              | `<Checkbox>`                                                   | Accessible Base UI checkbox with smooth checkmark animations.                                                                 |
| `<input type="radio">`                 | `<RadioGroup>` & `<RadioGroupItem>`                            | Accessible keyboard navigation and custom styled radio pills.                                                                 |
| `<input type="range">`                 | `<Slider>`                                                     | Tactile slider thumb with custom track colors.                                                                                |
| Toggle switches                        | `<Switch>`                                                     | Smooth iOS/clay-style toggle switch.                                                                                          |
| `<table>`                              | `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableCell>`        | Responsive, beautifully padded, and theme-compliant data tables.                                                              |
| Modal `<dialog>` / custom overlays     | `<Dialog>` or `<AlertDialog>`                                  | Focus trapping, screen reader support, ESC key closing, and animated overlay.                                                 |
| Side drawers / mobile menus            | `<Sheet>` or `<Drawer>`                                        | Smooth slide-in panels for mobile navigation, carts, and order details.                                                       |
| Tooltip `title="..."`                  | `<Tooltip>`, `<TooltipTrigger>`, `<TooltipContent>`            | Beautifully formatted popover tooltips with custom delay and arrow anchors.                                                   |
| `window.alert()` / `confirm()`         | `toast.success()`, `toast.error()` (Sonner) or `<AlertDialog>` | Non-blocking, actionable notifications with retry buttons.                                                                    |
| Custom loading spinners / divs         | `<Skeleton>` or `<Spinner>`                                    | Layout-stable skeletons preventing Cumulative Layout Shift (CLS).                                                             |
| Metric badges / tags                   | `<Badge variant="...">`                                        | Pill-shaped status indicators (`Success`, `Pending`, `Failed`).                                                               |

---

## 3. UI Engineering & Composition Patterns

### A. Compound Component Structure

Favor composition over prop explosion:

```tsx
// ✅ GOOD: Composable and clean
<Card className="p-6">
  <CardHeader>
    <CardTitle className="text-xl">Total Revenue</CardTitle>
    <CardDescription>+20.1% from last month</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold tabular-nums">$15,231.89</div>
    <RevenueChart data={revenueData} />
  </CardContent>
</Card>
```

### B. Number & Currency Formatting

- Always apply `tabular-nums` class to currencies, quantities, dates, and live statistics to prevent jitter during updates:
  ```tsx
  <span className="font-semibold tabular-nums">$316.00</span>
  ```

### C. Interactive Button States & Loading Indicators

- When executing async mutations, always disable the button and show a spinner or label state:
  ```tsx
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? (
      <>
        <Spinner className="mr-2 h-4 w-4" />
        Processing...
      </>
    ) : (
      "Upgrade Plan"
    )}
  </Button>
  ```

### D. Empty & Error States

- Use the `<Empty>` primitive when a table, search query, or chat thread has no items:
  ```tsx
  <Empty
    icon={<ShoppingBag className="size-10 text-muted-foreground" />}
    title="No orders found"
    description="Your store has not received any orders matching these filters yet."
  />
  ```

---

## 4. Accessibility (A11y) Standards

1. **Form Labels**: Every input must have a corresponding `<Label htmlFor="id">` or an explicit `aria-label`.
2. **Keyboard Trapping & Focus States**: All interactive elements must maintain visible, high-contrast focus rings (`outline-ring/50`).
3. **Color Contrast**: Text on background must meet WCAG 2.1 AA standards (minimum 4.5:1 ratio for normal text, 3:1 for large text).
