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

## 5. Code Quality & Verification

- Treat this document as mandatory guidance across the entire repository.
- Run `bun run check` (`oxlint && oxfmt --write`) before concluding tasks.
- Maintain **0 warnings and 0 errors** on all TypeScript and linter checks.
