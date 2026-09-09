# Monorepo Architecture & Backend Guidelines

This document contains mandatory architectural, database, backend API, and event-driven design rules for the entire `hono-commerce` monorepo.

---

## 1. Monorepo Structure & Package Boundaries

- **`apps/`**:
  - `apps/storefront`: Public storefront & customer portal (Next.js 16 App Router).
  - `apps/dashboard`: Store management (`/(tenant)`) and superadmin (`/(admin)`) portals (Next.js 16).
  - `apps/api`: Core backend API server (Hono on Bun).
  - `apps/realtime`: Dedicated real-time WebSocket server (Socket.io + Redis Pub/Sub).
  - `apps/worker`: Background job consumer (BullMQ + Redis).
- **`packages/`**:
  - `packages/db`: PostgreSQL schemas (Drizzle ORM) and migration scripts.
  - `packages/auth`: Better Auth configuration with Drizzle PostgreSQL adapter.
  - `packages/ui`: Shared Shadcn / Base UI component library.
  - `packages/env`: Type-safe environment variable validation (`@t3-oss/env-*`).
  - `packages/types`: Shared Zod schemas, DTOs, and domain types.
  - `packages/queue`: Pluggable Queue Manager, BullMQ definitions, and typed event publishers.
  - `packages/notification`: Email templates (React Email / Nodemailer) and notification handlers.
  - `packages/config`: Shared configurations for TypeScript, ESLint, Oxlint, and Tailwind CSS.

---

## 2. Database Schema & Migration Rules (`packages/db`)

- **Multi-Tenant Isolation Invariant**:
  - Every tenant-scoped entity MUST include a `tenantId: text("tenant_id").notNull().references(() => tenant.id, { onDelete: "cascade" })`.
  - Create composite indexes on `(tenant_id, ...)` for all filtered query paths (e.g. `uniqueIndex("product_slug_tenant_idx").on(table.tenantId, table.slug)`).
- **Naming Conventions**:
  - Database columns: `snake_case` (e.g. `price_in_cents`, `created_at`, `is_published`).
  - TypeScript schema definitions: `camelCase` (e.g. `priceInCents`, `createdAt`, `isPublished`).
- **Timestamp & Auditing**:
  - All persistent domain tables must include `createdAt` (`defaultNow()`) and `updatedAt` (`$onUpdate(() => new Date())`).
- **Money & Quantities**:
  - Store all monetary amounts as **integers in cents** (e.g. `priceInCents: integer("price_in_cents")`) to avoid floating-point errors.
- **Migrations**:
  - Generate migrations via `bun run db:generate` (or `turbo run db:generate`).
  - Apply migrations via `bun run db:migrate`.
  - Never commit raw untested manual SQL edits that diverge from Drizzle schema definitions.

---

## 3. Backend & API Design Rules (`apps/server`)

- **Route Organization & Versioning**:
  - Mount all business domain routes under `/api/v1` (e.g. `/api/v1/products`, `/api/v1/orders`, `/api/v1/tenants`).
  - Mount Better Auth handlers under `/api/v1/auth/*`.
- **Type-Safe RPC Export**:
  - Chain routes with Hono's route builder and export the consolidated route type:
    ```ts
    const routes = app
      .basePath("/api/v1")
      .route("/products", productsRouter)
      .route("/orders", ordersRouter);

    export type AppType = typeof routes;
    ```
- **Request Validation**:
  - Validate all request inputs (`json`, `query`, `param`) using `zod` schemas via `@hono/zod-validator` (`zValidator`).
- **Data Isolation**:
  - Every tenant API endpoint must extract `tenantId` from the authenticated session or verified hostname and filter database queries with `where(eq(table.tenantId, tenantId))`.
- **Standardized JSON Response Shape**:
  - Success: Return typed payload (e.g. `c.json({ data: items })` or `c.json({ success: true })`).
  - Errors: Return structured error format with appropriate HTTP status codes (e.g. `c.json({ error: "Product not found", code: "NOT_FOUND" }, 404)`).

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
7. **Code Quality & Verification Invariant**:
   - Treat this document as mandatory guidance across the entire repository.
   - Run `bun run check-types` and `bun run check` (`oxlint && oxfmt --write`) before concluding tasks.
   - Maintain **0 warnings and 0 errors** on all TypeScript and linter checks.
