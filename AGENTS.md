# Monorepo Architecture & Backend Guidelines

This document contains mandatory architectural, database, backend API, and event-driven design rules for the entire `hono-commerce` monorepo.

---

## 1. Monorepo Structure & Package Boundaries

- **`apps/`**:
  - `apps/storefront`: Public storefront & customer portal (Next.js 16 App Router).
  - `apps/dashboard`: Store management (`/(tenant)`), superadmin (`/(admin)`), and public auth/invitation (`/(public)`) portals (Next.js 16).

  - `apps/api`: Core backend API server (Hono on Bun).
  - `apps/realtime`: Dedicated real-time WebSocket server (Socket.io + Redis Pub/Sub).
  - `apps/worker`: Background job consumer (BullMQ + Redis).
- **`packages/`**:
  - `packages/db`: PostgreSQL schemas (Drizzle ORM) and migration scripts.
  - `packages/auth`: Better Auth configuration with Drizzle PostgreSQL adapter.
  - `packages/ui`: Shared Shadcn / Base UI component library.
  - `packages/env`: Type-safe environment variable validation (`@t3-oss/env-*`).
  - `packages/types`: Shared Zod request input schemas, route catalog, and domain types.
  - `packages/queue`: Pluggable Queue Manager, BullMQ definitions, and typed event publishers.
  - `packages/notification`: Email templates (React Email / Nodemailer) and notification handlers.
  - `packages/config`: Shared configurations for TypeScript, ESLint, Oxlint, and Tailwind CSS.

---

## 2. Database Schema & Migration Rules (`packages/db`)

- **Multi-Tenant Isolation Invariant**:
  - Every tenant-scoped entity MUST include a `tenantId: uuid("tenant_id").notNull().references(() => tenant.id, { onDelete: "cascade" })`.
  - Create composite indexes on `(tenant_id, ...)` for all filtered query paths (e.g. `uniqueIndex("product_slug_tenant_idx").on(table.tenantId, table.slug)`).
- **Naming Conventions**:
  - Database columns: `snake_case` (e.g. `price_in_cents`, `created_at`, `is_published`).
  - TypeScript schema definitions: `camelCase` (e.g. `priceInCents`, `createdAt`, `isPublished`).
- **Timestamp & Auditing**:
  - All persistent domain tables must include `createdAt` (`defaultNow()`) and `updatedAt` (`$onUpdate(() => new Date())`).
- **Money & Quantities**:
  - Store all monetary amounts as **integers in cents** (e.g. `priceInCents: integer("price_in_cents")`) to avoid floating-point errors.
- **Strict Human-Only Migration Management Invariant**:
  - AI agents MUST NEVER generate, edit, delete, push, or run database migrations (`bun run db:generate`, `bun run db:migrate`, `bun run db:push`, `drizzle-kit generate`, etc.).
  - AI agents are strictly limited to authoring and editing Drizzle TypeScript schema definitions (`packages/db/src/schema/*.ts`).
  - Generating SQL migrations, inspecting diffs, and applying migrations to the database requires human involvement and developer execution.
  - Never commit raw untested manual SQL edits that diverge from Drizzle schema definitions.

---

## 3. Backend & API Design Rules (`apps/api`)

- **Vertical Slice & Modular Domain Architecture (`apps/api/src/modules/<domain>/`)**:
  - Organize all business domains into dedicated modules under `apps/api/src/modules/<domain>/` (e.g. `tenants/`, `invitations/`, `notifications/`, `users/`, `storage/`).
  - **One-File-Per-Handler Pattern**:
    - Each HTTP operation/endpoint lives in its own dedicated file under `modules/<domain>/handlers/<operation>.ts` (e.g. `handlers/update-status.ts`, `handlers/resolve-invitation.ts`).
    - Handlers are authored using Hono's `createFactory().createHandlers(zValidator(...), async (c) => ...)`.
    - Every handler file has single responsibility for its specific HTTP operation. Focus on modular clarity, self-contained error handling, and business logic cohesion without imposing artificial line limits.
    - **No Monolithic Service Anti-Pattern**: Never create fat 1,000+ line service files that bundle dozens of unrelated operations. Complex business logic or actions reused by background workers should be authored as focused, single-purpose functions in `actions/` or `services/` alongside handlers.
  - **Declarative Router Index (`*.routes.ts`)**:
    - Each module exposes a clean `*.routes.ts` file that strictly maps HTTP verbs and route paths to imported handlers:
      ```ts
      export const invitationsRouter = new Hono()
        .get("/:invitationId", ...resolveInvitationHandler)
        .patch("/:invitationId", ...updateInvitationStatusHandler);
      ```
- **Explicit RESTful Resource & Nested Scopes**:
  - **Store / Tenant Management**: Explicitly nested under `/api/v1/tenants/:tenantId/...` (e.g. `/tenants/:tenantId/members`, `/tenants/:tenantId/invitations`).
  - **Public Invitee Gateway**: `/api/v1/invitations/:invitationId` (`GET` to preview invitation with `?token=...`, `PATCH` to update status `{ status: "accepted" | "rejected", token }`).
  - **User Personal Scope**: `/api/v1/users/me/...` (current user profile, personal notifications, preferences).
  - **Better Auth Handlers**: Mounted under `/api/v1/auth/*`.
  - **Platform Governance**: Mounted under `/api/v1/platform/...` (superadmin tenant oversight, BullMQ queues).
- **Type-Safe RPC Export & Zero-Route-Dictionary Invariant**:
  - Chain all domain routers into the root app under `/api/v1` and export the unified type:
    ```ts
    const routes = app
      .basePath("/api/v1")
      .route("/tenants", tenantsRouter)
      .route("/invitations", invitationsRouter)
      .route("/users", usersRouter)
      .route("/storage", storageRouter);

    export type AppType = typeof routes;
    ```
  - **Zero Manual API Route Dictionaries**: Never author or maintain manual backend API route dictionaries (e.g. `routes.api = { ... }`). `apiClient = hc<AppType>(...)` automatically infers the complete callable API tree, methods, URL parameters, query parameters, request bodies, and return types directly from the backend TypeScript AST.
  - `packages/types/src/routes/catalog.ts` is strictly reserved for **frontend UI page routes** (Next.js App Router paths for `<Link href="...">` navigation), never backend API endpoints.
  - **Client Shorthand Export Standard (`api = client.api.v1`)**: To eliminate repetitive `.api.v1` typing across the frontend, consuming applications export `export const api = client.api.v1;` from `@/lib/api-client`. Call sites invoke `api.tenants...`, `api.invitations...`, and `api.users...` directly while maintaining 100% full type safety and compiler autocompletion.
- **Hono RPC Response Type Inference (ADR-005)**:
  - Frontend applications and consumers MUST infer response payloads directly from Hono endpoints using `InferResponseType<typeof api.[domain].$get, 200>` (from `hono/client`).

  - Never declare redundant, manual response DTOs or response schemas in `@hono-commerce/types`.
- **Request Validation & Shared Schemas**:
  - Validate all request inputs (`json`, `query`, `param`) using Zod schemas via `@hono/zod-validator` (`zValidator`).
  - Shared request input schemas are authored **once** in `@hono-commerce/types` (`packages/types/src/schemas/<domain>.ts`) and reused directly across backend `zValidator` and frontend `react-hook-form` / `zodResolver`.
- **Data Isolation**:
  - Every tenant API endpoint must extract `tenantId` from URL params or verified hostname and filter database queries with `where(eq(table.tenantId, tenantId))`.
- **Standardized JSON Response Envelope & Discriminated Unions**:
  - All API routes MUST return standardized envelope payloads using typed helpers from `apps/api/src/lib/response` (`ok`, `paginated`, `fail`) and `packages/types/src/domain/api-response.ts`:
    - **Resource Success**: `c.json(ok({ data: item, message?: string }), 200)` $\to$ `{ success: true, data: T, message?: string }`.
    - **Paginated Collection**: `c.json(paginated({ data: items, meta: paginationMeta, message?: string }), 200)` $\to$ `{ success: true, data: T[], meta: PaginationMeta, message?: string }`.
    - **Action / Mutation Success**: `c.json(ok({ message: "Invitation resent" }), 200)` $\to$ `{ success: true, message: string }`.
    - **Error / Failure**: `c.json(fail({ error: "Product not found", code: "NOT_FOUND", issues?: ValidationIssue[] }), 404)` $\to$ `{ success: false, error: string, code: string, issues?: ValidationIssue[] }`.
  - Helpers accept a single named options object (`ok({ data, message })`, `paginated({ data, meta })`, `fail({ error, code })`).
  - Request validation uses `validated(target, schema)` (wrapping `@hono/zod-validator`) which automatically formats validation errors into `{ success: false, error: "Validation failed", code: "VALIDATION_ERROR", issues }`.

---

## 4. Asynchronous Events & Queuing Architecture (`packages/queue` & `apps/worker`)

- **Unified Redis Message Bus (BullMQ)**:
  - **Instant Queues**: `orders` (fulfillment state machine), `stripe-webhooks` (idempotent Stripe ingest), `tenant-webhooks` (HMAC outbound delivery), `emails` (React Email / Nodemailer).
  - **Delayed Queues**:
    - `inventory-locks` (15m delay: checkout cart expiry).
    - `abandoned-cart` (2h delay: recovery email drip).
    - `chat-digest` (5m delay: debounced offline unread chat summary).
  - **Recurring Crons**:
    - `cron-payouts` (Nightly @ 00:00 UTC: Stripe Connect split reconciliation).
    - `cron-analytics` (Hourly: tenant GMV & metric rollups).
  - **Visual Monitoring**: Bull-Board dashboard mounted in `apps/dashboard/(admin)`.
- **Domain-Isolated Jobs Architecture (`packages/queue/src/jobs/*`)**:
  - All queue-specific contracts, payload schemas, template prop schemas, and discriminated unions MUST be isolated in domain modules under `packages/queue/src/jobs/<domain>.ts` (e.g. `jobs/email.ts`, `jobs/orders.ts`, `jobs/stripe-webhooks.ts`, `jobs/inventory.ts`).
  - `packages/queue/src/types.ts` is reserved strictly for queue-wide definitions (`QueueName`, `QueueNameType`, `EnqueueEmailOptions`) and re-exporting domain job types (`export * from "./jobs/email"`).
  - Composed job schemas must use `Base<Domain>JobSchema.and(<Domain>PayloadSchema)` with support for optional multi-tenant context (`tenantId?: string`) and `idempotencyKey?: string`.
  - Export subpaths in `packages/queue/package.json` must map `"./jobs/*": "./src/jobs/*.ts"` to enable clean domain imports without cluttering the package root.
- **Strict Decoupling Invariant**:
  - Application routes (`apps/api`, `apps/storefront`, `apps/dashboard`) MUST NEVER import BullMQ directly.
  - All event publishing MUST go through typed functions exported by `@hono-commerce/queue` (`packages/queue/src/publishers/*`) to allow pluggable future expansion (e.g. Golang microservices or RabbitMQ bridges).
- **Consumer Idempotency**:
  - All background workers must use idempotency keys (e.g. `jobId: stripeEvent.id` or `order.id`) to prevent duplicate processing.
- **Fast Webhook Response**:
  - Inbound webhook handlers (e.g. Stripe) must immediately enqueue raw events to BullMQ and respond with `200 OK` in $<20\text{ms}$.

---

---

## 5. Shared UI Component Architecture (`packages/ui`)

`packages/ui` enforces a strict separation between **Atomic Primitives** and **Composite Shared UI Systems**:

### A. Atomic Primitives (`@hono-commerce/ui/components/*`)

- Pure, unstyled or headless base primitives: `button`, `card`, `dialog`, `drawer`, `dropdown-menu`, `field`, `input`, `input-group`, `popover`, `resizable`, `select`, `sheet`, `sidebar`, `table`, `tabs`, `textarea`, `tooltip`, etc.
- **Invariant**: Primitives must never contain application-specific business logic or layout coupling.

### C. Frontend Form and Server-State Standard

- Every frontend form in `apps/dashboard`, `apps/storefront`, and shared feature flows MUST use the corresponding shadcn/Base UI primitives from `@hono-commerce/ui` for controls and `Field`/`FieldGroup` for layout and validation messaging.
- Form field state and submission handling MUST use React Hook Form with `@hookform/resolvers/zod` and a Zod schema authored in `packages/types/src/schemas/*`.
- Any form that changes server state MUST submit through a typed Hono RPC call wrapped in TanStack Query `useMutation`, with scoped invalidation or refetch after success. View-only controls may use local React state.
- **URL-addressable view state MUST use `nuqs`**: search text, filters, date ranges, pagination, page size, sorting, route tabs, selected rows/resources, and shareable drawer or split-view state belong in typed URL query parameters rather than component-local state.
- Each Next.js App Router application MUST mount `NuqsAdapter` once at its root client-provider boundary. Feature modules MUST define typed parser contracts with `parseAsString`, `parseAsInteger`, `parseAsBoolean`, `parseAsStringEnum`, or `parseAsArrayOf`; reuse the same parser definitions in server components through `nuqs/server` `createSearchParamsCache` when server-side parsing is required.
- URL state MUST feed TanStack Query: normalize parsed values, include them in the query key, and map them to typed Hono RPC query parameters. TanStack Query owns cached server data and request status; `nuqs` owns the URL representation. URL state MUST NOT be duplicated in the query cache or mirrored into a second local-state source.
- Use `clearOnDefault` for canonical URLs and debounce high-frequency search updates with nuqs URL-update options. Validate and clamp values at the API boundary with shared Zod schemas. Do not manually mutate `URLSearchParams` or use ad-hoc router query strings.
- Transient interaction state (popover open state, hover, focus, local loading, unsaved React Hook Form drafts, and animation state) MAY remain in React state. Secrets, tokens, and personally identifiable data MUST NOT be placed in the URL.
- Shared request schemas MUST be reused by backend `zValidator` and frontend `react-hook-form`/`zodResolver`; ad-hoc payload shapes are forbidden.
- Raw `<input>`, `<select>`, `<textarea>`, `<button>`, and custom control replacements are forbidden when a shared primitive exists. A semantic `<form>` element is allowed as the React Hook Form submission boundary.
- Form fields MUST expose visible labels, `data-invalid`, `aria-invalid`, disabled state, and `FieldError` feedback according to the app-level frontend instructions.

### B. Composite Shared UI Systems (`@hono-commerce/ui/shared/*`)

High-level reusable modules used across `storefront` and `dashboard`:

1. **File Preview & Media System (`@hono-commerce/ui/shared/file/*`)**:
   - `MimeIcon`: Dynamic color-coded icons (PDF, image, video, audio, code, archive, spreadsheets).
   - `FilePreview`: Multi-format renderer (PDF iframe with `#toolbar=0`, image, native video, audio player, code/text preview, and binary download fallback).
   - `FilePreviewDrawer` & `FilePreviewButton`: Resizable bottom drawer with fullscreen toggle (`80dvh` $\leftrightarrow$ `100dvh`), MIME badges, and privacy indicators.
   - `useS3Url`: Client hook for resolving signed S3 URLs.
2. **Data Table & Advanced Filters (`@hono-commerce/ui/shared/data-table/*`)**:
   - `DataTablePagination`: Rows-per-page selector, selection counter, and pagination controls.
   - `DataTableColumnHeader`: Sort asc/desc, hide column, and clear sorting dropdown.
   - `DataTableViewOptions`: Column visibility toggles.
   - `CommerceFilters`: Animated expandable search bar with clear action, select filters, and "Clear all" button.
   - `EmptyState` & `OperationalEmptyState`: Zero-data empty states with action CTAs.
3. **Global Stacked Drawer & Modal System (`@hono-commerce/ui/shared/drawer/*`, `modal/*`)**:
   - `useDrawer` / `GlobalDrawer`: Stacked drawer state supporting left/right/top/bottom placements, `naked` custom wizards, and horizontal resize panels.
   - `useModal` / `GlobalModal`: Single-modal state for alerts and dialogs.
   - `ConfirmDialog`: Standardized confirmation dialog for destructive actions with loading states.
4. **Resizable Split-View (`@hono-commerce/ui/shared/split-view/*`)**:
   - `useSplitView` / `GlobalSplitView`: Right-hand resizable split screen for live chat, AI assistant, document review, and deep inspector panels.
5. **Dashboard & Metric Systems (`@hono-commerce/ui/shared/dashboard/*`)**:
   - `WorkspaceHeroLayout` / `DashboardHero`: Hero header with status tones (`setup`, `review`, `attention`, `live`, `ready`, `primary`), glowing backgrounds, live pulse dots, title, description, and metric grid.
   - `MetricTile` / `StatCard`: Key metric cards with trend indicators and icons.
   - `StatusPill`: Color-coded badge pills (emerald, amber, rose, blue, violet).
   - `QueueCard`: Action queue card with status pills, blocker tags, and CTA buttons.
6. **Layout & Multi-Tenant Primitives (`@hono-commerce/ui/shared/layout/*`)**:
   - `ResponsiveContentSidebarLayout`: Sticky collapsible right sidebar panel on desktop + floating trigger and sheet on mobile.
   - `useResponsiveContentSidebar`: Hook to dynamically swap or override sidebar from nested tabs.
   - `TenantSwitcher`: Subdomain / store switcher dropdown.
7. **Tabs & Forms (`@hono-commerce/ui/shared/tabs/*`, `forms/*`)**:
   - `CommerceTabs`: Dual-mode tabs (Route-mode with animated sliding indicator & Content-mode with query sync).
   - `useDragScroll`: Horizontal drag-to-scroll hook for mouse/touch navigation.
   - `OnboardingTimeline` / `StepCard`: Multi-step animated timeline with status badges and action triggers.

---

## 6. Backend Utilities & Storage Architecture (`apps/api/src/lib/*` & `packages/notification`)

1. **AWS S3 & Presigned Storage (`apps/api/src/lib/s3/*`)**:
   - `getReadSignedUrl(s3Key, expiresIn = 3600)`: Short-lived signed URLs for private files.
   - `getUploadPresignedUrl({ s3Key, contentType })`: Direct client-to-S3 presigned `PUT` URLs.
   - `deleteS3Object(s3Key)`: Server-side file deletion.
   - `generateTenantS3Key({ tenantId, category, fileName })`: Structured isolation (`tenants/{tenantId}/{category}/{timestamp}-{random}-{fileName}`).
   - Storage endpoints mounted under `/api/v1/storage/upload-url` and `/api/v1/storage/preview-url`.
2. **Tenant Context & Subdomain Resolution (`apps/api/src/lib/tenant/*`)**:
   - `extractSubdomain(host, rootDomain)`: Strips port, respects reserved subdomains (`www`, `app`, `api`, `auth`, `admin`, `store`).
   - `extractTenantSlugFromHeaders(headers)`: Prioritizes `x-tenant-slug` / `x-org-slug` $\to$ `x-current-path` $\to$ `host`.
3. **Query Pagination & Search (`apps/api/src/lib/query/*`)**:
   - `parsePaginationParams(query)`: Enforces safe bounds ($1 \le \text{limit} \le 100$).
   - `buildPaginatedResult({ data, totalCount, page, limit })`: Generates `totalPages`, `hasNextPage`, `hasPreviousPage`.
4. **Rich Text Validation (`apps/api/src/lib/rich-text/*`)**:
   - `stripRichTextHtml(value)` & `hasMeaningfulRichText(value)`: Prevents saving empty `<p></p>` or whitespace as valid descriptions.
5. **Typed Notification Engine (`packages/notification`)**:
   - `notifyUser(type, payload, options)`
   - `notifyTenant(type, payload, options)`
   - `notifySystem(type, payload, options)`
   - Dispatches via `Promise.allSettled` so non-critical external delivery failures (e.g. email, push) never roll back or crash database transactions.

---

## 7. Mandatory Recommendations & Invariants for AI Agents

1. **Component Cleanliness & Boundary Invariant**:
   - Never put composite application widgets into `packages/ui/src/components/`. All high-level / composite components MUST be placed in `packages/ui/src/shared/<domain>/`.
   - Never write raw unstyled HTML elements (`<button>`, `<input>`, `<table>`, `<select>`, `<dialog>`) when Base UI primitives in `@hono-commerce/ui/components/*` exist.
2. **Base UI `render` Prop Invariant**:
   - `@hono-commerce/ui` uses `@base-ui/react`. Never use Radix `asChild` prop. Always compose using `render={<Button ... />}` or `render={<a ... />}`.
3. **Anti-Prop-Drilling Invariant**:
   - Never drill `tenantId` or `orgSlug` through multiple levels of component props. Derive tenant context server-side from request headers using `extractTenantSlugFromHeaders()`, or client-side from workspace context.
4. **S3 Security Invariant**:
   - Never save permanent public URLs in the database for private tenant files or KYC documents. Save the `s3Key` and generate short-lived signed URLs via `/api/v1/storage/preview-url` or `getReadSignedUrl()`.
5. **Notification Non-Blocking Invariant**:
   - Notifications and side-effects must be triggered AFTER database transactions commit, using `notifyUser()` / `notifyTenant()` or by enqueuing a BullMQ job via `@hono-commerce/queue`.
6. **Forward-Compatible RBAC & Role Taxonomy Invariant**:
   - Strictly adhere to the platform and tenant role taxonomy:
     - **Platform**: `admin` (superadmin) and `staff` (operations/support).
     - **Merchant**: `owner` (store creator, payouts, billing) and `member` (staff, catalog, orders).
   - Never write fragile ad-hoc inline role checks (e.g. `if (user.role === 'admin')`) in UI components or route handlers.
   - Always gate features using the forward-compatible `hasPermission(authContext, permission)` helper on the server and `<PermissionGate permission="...">` on the frontend.
   - Permissions must be resolved once upon login and attached directly to the user session (`session.user.permissions`) to eliminate per-request or per-render database permission queries.
7. **Code Quality & Verification Invariant (No Build Rule)**:
   - Treat this document as mandatory guidance across the entire repository.
   - Run `bun run verify` (`oxlint && oxfmt --check && turbo run check-types`) before concluding tasks. Use `bun run check` (`oxlint && oxfmt --write`) to automatically format code when needed.
   - **DO NOT run `bun run build`** (or `turbo run build`) during development task verification. Running `bun run verify` is sufficient and prevents unnecessary overhead and compile locks.
   - Maintain **0 warnings and 0 errors** on all TypeScript and linter checks.
8. **Environment Variable Management Invariant (`packages/env` & `.env.example`)**:
   - Whenever ANY environment variable is introduced, referenced, or used in ANY application or package, you MUST:
     1. Add its type-safe schema and runtime binding to `@hono-commerce/env` (`packages/env/src/<app>.ts`).
     2. Document it in the corresponding `.env.example` file(s) for every app that consumes it.
   - Never reference undeclared or raw `process.env` variables in application code without registering them in `@hono-commerce/env` and `.env.example`.
9. **Strict Type Inference & Zero-Escape-Hatch Invariant (No `any`, No `unknown`)**:
   - **Zero `any` and Zero `unknown`**: Never use `any` or `unknown` as escape hatches in type annotations, function signatures, or casting targets (e.g. `Record<string, unknown>`, `(x: any) => ...`, `props as unknown as ...`, `as any`).
   - **Enforced via Oxlint**: Banned across the entire monorepo by `typescript/no-explicit-any` and `typescript/no-restricted-types`. Any occurrence will immediately fail `bun run check` and `bun run verify`.
   - **Architectural Solutions**: Always model polymorphic payloads, event jobs, and function inputs using:
     1. **Discriminated Unions**: e.g. `{ template: "magic-link"; props: MagicLinkEmailProps } | { template: "tenant-invitation"; props: InvitationEmailProps }`.
     2. **Generic Lookup Maps / Registries**: e.g. `renderEmailTemplate<T extends EmailTemplate>(template: T, props: EmailTemplatePropsMap[T])`.
     3. **Precise Domain Interfaces & Primitive Unions**: e.g. `Record<string, string | number | boolean | null>` instead of loose `Record<string, unknown>`.
   - **No Type Assertions**: Never use type assertions (`as Route`, `as any`, or `as unknown as ...`) to silence routing or component type errors. All types must be naturally inferred or narrowed via type guards.
10. **Agentic Spec-Driven Development (SDD) Invariant**:

- When requested to build or significantly modify a feature, domain flow, or API, you MUST follow the 5-phase Spec-Kit lifecycle before writing implementation code:
  1.  **Specify**: Scaffold `docs/specs/<NNN-feature>/spec.md` using `docs/specs/_template/spec.md`. Define Given-When-Then acceptance scenarios, RFC 2119 invariants, and edge cases. Align with user on the specification.
  2.  **Plan**: Scaffold `docs/specs/<NNN-feature>/plan.md`. Map monorepo package impact and define contracts.
  3.  **Tasks**: Scaffold `docs/specs/<NNN-feature>/tasks.md` with ordered, verifiable checklists.
  4.  **Implement**: Contract-first. Implement shared request input schemas and route catalog in `@hono-commerce/types`; infer response types directly via Hono RPC (`InferResponseType`) rather than hand-writing response DTOs.
  5.  **Converge**: Run `bun run verify` (`oxlint && oxfmt --check && turbo run check-types`) to achieve 0 warnings and 0 errors.

11. **Design System & Visual Quality Invariant (`packages/ui/DESIGN.md` & `ui-ux-pro-max`)**:
    - All UI components, pages, forms, and views across `apps/dashboard`, `apps/storefront`, and `@hono-commerce/ui` must strictly follow [`packages/ui/DESIGN.md`](file:///home/edmealem.k/Downloads/hono-commerce/packages/ui/DESIGN.md).
    - Never use arbitrary raw hex colors or inline style overrides; always leverage semantic Tailwind v4 tokens from `globals.css`.
    - Implement the mandatory 6-state matrix (Initial, Loading, Success, Empty, Error, Expired) for every interactive feature and form to guarantee zero layout shifts and seamless user feedback.
12. **Strict Human-Only Migration Management Invariant**:
    - AI agents MUST NEVER create, edit, delete, push, or execute database migration files (`bun run db:migrate`, `bun run db:push`, etc.).
    - AI agents are strictly limited to authoring and updating Drizzle TypeScript schema definitions (`packages/db/src/schema/*.ts`).
    - Generating SQL migration files, reviewing diffs, and applying migrations to the database requires human involvement and developer execution.
