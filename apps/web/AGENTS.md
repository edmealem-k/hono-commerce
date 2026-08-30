<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# Web Workspace & UI Engineering Guidelines (`apps/web`)

This document contains mandatory rules for frontend development, component composition, form handling, and styling in the `apps/web` application.

---

## 1. UI & Component Architecture (Base UI + Shadcn)

- **Component Source**: Always import components from `@hono-commerce/ui/components/...`. Do not write local one-off duplicates in `apps/web/src/components/ui`. If a needed component is missing, add it to `packages/ui` first.
- **Base UI Primitives (Not Radix `asChild`)**: This workspace uses `@base-ui/react`. When a component supports composition (e.g. `<DropdownMenuTrigger render={<Button ... />} />`), use the `render` prop. Do not assume Radix `asChild`.
- **Zero Raw HTML Inputs/Buttons Policy**:
  - `<Button>` instead of `<button>`
  - `<Input>` / `<InputGroup>` instead of `<input>`
  - `<Textarea>` instead of `<textarea>`
  - `<Select>` / `<Combobox>` instead of `<select>`
  - `<Checkbox>` instead of `<input type="checkbox">`
  - `<RadioGroup>` instead of `<input type="radio">`
  - `<Switch>` instead of custom toggle divs
  - `<Table>` / `<TableHeader>` / `<TableRow>` / `<TableCell>` instead of raw `<table>`
  - `<Dialog>` / `<AlertDialog>` / `<Sheet>` instead of modal divs or `<dialog>`
  - `<Tooltip>` / `<TooltipTrigger>` / `<TooltipContent>` instead of HTML `title`
  - `<Skeleton>` / `<Spinner>` instead of custom loading placeholders
  - `<Badge>` instead of custom status tag divs
  - `<Sonner>` (`toast.success()`, `toast.error()`) instead of `alert()` / `confirm()`
- In `apps/web`, do not use `Button href={...}` or manually style `Link` to look like a button for CTA/navigation actions. Use `<Link href="/..."><Button>...</Button></Link>` or Base UI `render={<Button ... />}` composition.

---

## 2. Forms & Validation

- **Base UI `Field` Composition**: Use Base UI form primitives from `@hono-commerce/ui/components/field` (`Field`, `FieldGroup`, `FieldSet`, `FieldLegend`, `FieldLabel`, `FieldDescription`, `FieldError`).
- Build forms using: `FieldGroup` + `Field` + control (`Input`, `Select`, `Textarea`, etc.) + `FieldLabel` / `FieldDescription` / `FieldError`.
- **Input Addons & Embeds**: Use `InputGroup` with `InputGroupInput` / `InputGroupTextarea` for inputs with icon prefixes, suffixes, or embedded action buttons.
- **Option Sets**: Use `FieldSet` + `FieldLegend` for grouping related checkboxes/radios. Use `ToggleGroup` for 2–7 option button groups instead of looping raw `Button`.
- **Form State & Schemas**: Always manage form validation using `react-hook-form` + `@hookform/resolvers/zod` with explicit `zod` schemas.
- **Validation State**:
  - Mark validation state with `data-invalid` on `Field` and `aria-invalid` on the control.
  - Mark disabled state with `data-disabled` on `Field` and `disabled` on the control.
  - Use `FieldError` for validation messages.

---

## 3. Menus, Modals & Navigation

- **No Raw HTML `<details>`/`<summary>`**: Do not use raw HTML `details`/`summary` for dropdowns, app navigation, or accordions.
- **Shadcn Navigation Primitives**: Always use `DropdownMenu`, `NavigationMenu`, `Accordion`, `Collapsible`, `Popover`, `Sheet`, or `Drawer` so keyboard behavior (`Tab`, `Escape`, arrow keys), layering (z-index), and screen-reader accessibility remain consistent.

---

## 4. Client Data Fetching (Hono Native RPC + TanStack Query)

- **Frontend RPC Client**: Always use `apiClient` from `@/lib/api-client` (`hc<AppType>`). Never make un-typed ad-hoc `fetch("/api/...")` requests.
- **Client-Side Queries & Mutations**: Wrap API calls in TanStack Query (`useQuery`, `useMutation`) using `getQueryClient()` from `@/lib/query-client`.
- **Number & Currency Formatting**: Always apply `tabular-nums` class to prices, metrics, dates, and live numbers (e.g. `<span className="tabular-nums">$15,231.89</span>`) to prevent horizontal layout shift.

---

## 5. Visual Design Tokens & Claymorphism Styling

- **Theme Palette**: Respect the Dark Slate & Indigo claymorphic tokens defined in `packages/ui/src/styles/globals.css`.
- **Surfaces**:
  - Canvas background: `bg-background`
  - Cards & Panels: `bg-card border shadow-md rounded-2xl`
  - Inset Controls: `bg-muted` / `bg-secondary`
- **Primary CTA**: `bg-primary text-primary-foreground` (`#818cf8` / indigo-violet).
- **Asynchronous Feedback**: Disable buttons and display `<Spinner className="mr-2 h-4 w-4" />` during mutation/submit states.
- **Empty States**: Render the `<Empty>` primitive for zero-data lists (orders, reviews, products).
