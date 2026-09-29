<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# Storefront Workspace & UI Engineering Guidelines (`apps/storefront`)

This document contains mandatory rules for frontend development, component composition, form handling, and styling in the `apps/storefront` application.

---

## 1. UI & Component Architecture (Base UI + Shadcn)

- **Component Source**: Always import atomic primitives from `@hono-commerce/ui/components/...` and composite systems from `@hono-commerce/ui/shared/...`. Do not write local one-off duplicates in `apps/storefront/src/components/ui`. If a needed component is missing, add it to `packages/ui` first.
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
- In `apps/storefront`, do not use `Button href={...}` or manually style `Link` to look like a button for CTA/navigation actions. Use `<Link href="/..."><Button>...</Button></Link>` or Base UI `render={<Button ... />}` composition.

### Composite Shared UI Modules (`@hono-commerce/ui/shared/*`)

- **S3 Media & Previews**: `@hono-commerce/ui/shared/file/file-preview-drawer` (`FilePreviewDrawer`, `FilePreviewButton`, `MimeIcon`)
- **Tables & Filters**: `@hono-commerce/ui/shared/data-table/*` (`DataTablePagination`, `DataTableColumnHeader`, `DataTableViewOptions`, `CommerceFilters`, `EmptyState`)
- **Global Drawers & Modals**: `@hono-commerce/ui/shared/drawer/global-drawer` (`useDrawer`, `GlobalDrawer`), `@hono-commerce/ui/shared/modal/*` (`useModal`, `GlobalModal`, `ConfirmDialog`)
- **Resizable Split View**: `@hono-commerce/ui/shared/split-view/global-split-view` (`useSplitView`, `GlobalSplitView`)
- **Dashboard Heroes & Metrics**: `@hono-commerce/ui/shared/dashboard/*` (`WorkspaceHeroLayout`, `MetricTile`, `StatusPill`, `QueueCard`)
- **Layout & Multi-Tenant**: `@hono-commerce/ui/shared/layout/*` (`ResponsiveContentSidebarLayout`, `TenantSwitcher`)
- **Tabs & Scrolling**: `@hono-commerce/ui/shared/tabs/commerce-tabs` (`CommerceTabs`, `useDragScroll`)
- **Forms & Timeline**: `@hono-commerce/ui/shared/forms/onboarding-timeline` (`OnboardingTimeline`, `StepCard`)

---

## 2. Customer Portal & Storefront Navigation

- **Public Catalog**: Browsing products, categories, search, filtering, and customer reviews.
- **Cart & Checkout**: Instant BullMQ order locks, Stripe Elements, and guest/customer checkout flows.
- **Customer Portal**: Order history tracking, invoice downloads, and live tenant support chat.

---

## 3. Forms & Validation

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

## 4. Menus, Modals & Navigation

- **No Raw HTML `<details>`/`<summary>`**: Do not use raw HTML `details`/`summary` for dropdowns, app navigation, or accordions.
- **Shadcn Navigation Primitives**: Always use `DropdownMenu`, `NavigationMenu`, `Accordion`, `Collapsible`, `Popover`, `Sheet`, or `Drawer` so keyboard behavior (`Tab`, `Escape`, arrow keys), layering (z-index), and screen-reader accessibility remain consistent.

---

## 5. Client Data Fetching (Hono Native RPC + TanStack Query)

- **Frontend RPC Client**: Always use `apiClient` from `@/lib/api-client` (`hc<AppType>`). Never make un-typed ad-hoc `fetch("/api/...")` requests.
- **Response Type Inference (ADR-005)**: Infer query and mutation response types directly via `InferResponseType<typeof apiClient.api.v1.[domain].$get, 200>` from `hono/client`. Do NOT create redundant hand-written response DTOs.
- **Client-Side Queries & Mutations**: Wrap API calls in TanStack Query (`useQuery`, `useMutation`) using `getQueryClient()` from `@/lib/query-client`.
- **Number & Currency Formatting**: Always apply `tabular-nums` class to prices, metrics, dates, and live numbers (e.g. `<span className="tabular-nums">$15,231.89</span>`) to prevent horizontal layout shift.

---

## 6. Visual Design Tokens & Claymorphism Styling

- **Theme Palette**: Respect the Dark Slate & Indigo claymorphic tokens defined in `packages/ui/src/styles/globals.css`.
- **Surfaces**:
  - Canvas background: `bg-background`
  - Cards & Panels: `bg-card border shadow-md rounded-2xl`
  - Inset Controls: `bg-muted` / `bg-secondary`
- **Primary CTA**: `bg-primary text-primary-foreground` (`#818cf8` / indigo-violet).
- **Asynchronous Feedback**: Disable buttons and display `<Spinner className="mr-2 h-4 w-4" />` during mutation/submit states.
- **Empty States**: Render the `<EmptyState>` / `<OperationalEmptyState>` primitives for zero-data lists (orders, reviews, products).
