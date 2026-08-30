<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->

# Dashboard Workspace & UI Engineering Guidelines (`apps/dashboard`)

This document contains mandatory rules for frontend development, component composition, form handling, and styling in the `apps/dashboard` application.

---

## 1. UI & Component Architecture (Base UI + Shadcn)

- **Component Source**: Always import components from `@hono-commerce/ui/components/...`. Do not write local one-off duplicates in `apps/dashboard/src/components/ui`. If a needed component is missing, add it to `packages/ui` first.
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

---

## 2. Route Groups & Portal Structure

- **`/(tenant)`**: Merchant store management portal (Products, Orders, Team & RBAC, Support Chat).
- **`/(admin)`**: Platform superadmin portal (Tenants, Subscriptions, Review Moderation, Escalations).

---

## 3. Client Data Fetching (Hono Native RPC + TanStack Query)

- **Frontend RPC Client**: Always use `apiClient` from `@/lib/api-client` (`hc<AppType>`).
- **Client-Side Queries & Mutations**: Wrap API calls in TanStack Query (`useQuery`, `useMutation`) using `getQueryClient()` from `@/lib/query-client`.
- **Number & Currency Formatting**: Always apply `tabular-nums` class to prices, metrics, dates, and live numbers (`$15,231.89`).
