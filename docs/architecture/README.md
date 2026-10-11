# System Architecture & Technical Standards

This directory serves as the **architectural source of truth** for the `hono-commerce` monorepo. All feature specifications (`docs/specs/`) and agent implementations inherit their rules and constraints directly from these documents.

---

## 1. Core Architectural Blueprints

| Document                                                                       | Scope                                                                                    | Key Invariants                                                                                                            |
| :----------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **[`system-architecture.md`](./system-architecture.md)**                       | Global monorepo topology, package boundaries, data flows, and infrastructure             | Multi-tenant isolation, BullMQ event bus, integer cents for currency, Docker & Bun setup                                  |
| **[`routing-and-proxy-architecture.md`](./routing-and-proxy-architecture.md)** | Subdomain proxy routing, visible URL structures, and Next.js 16 App Router configuration | Subdomain-first architecture (`[slug].localhost:PORT`), no `typedRoutes: true` compile lockouts, universal `getBaseUrl()` |
| **[`authentication-architecture.md`](./authentication-architecture.md)**       | Better Auth configuration, session cookies, multi-subdomain auth sharing                 | `/api/v1/auth/*` mount, cross-subdomain cookie sharing, role taxonomy (`admin`, `staff`, `owner`, `member`)               |
| **[`design-system-guidelines.md`](./design-system-guidelines.md)**             | Shared UI component system (`packages/ui`) and styling standards                         | Base UI `render` prop (never Radix `asChild`), composite modules under `packages/ui/src/shared/*`                         |

---

## 2. Architecture Decision Records (ADRs)

Key architectural decisions that govern our design choices and prevent regression:

### ADR-001: Subdomain-First Multi-Tenancy via Next.js Proxy

- **Context**: Tenant isolation can be achieved via path prefixes (`/tenants/nike/products`) or subdomains (`nike.domain.com/products`).
- **Decision**: Adopt subdomain-first routing in both local development (`nike.localhost:3002`) and production (`nike.domain.com`).
- **Rationale**: Clean, branded merchant URLs, simplified reverse-proxying with custom CNAME domains, and parity between development and production.

### ADR-002: Base UI with `render` Prop (No Radix `asChild`)

- **Context**: Headless component primitives often use Radix UI's `asChild` cloning pattern or Base UI's function `render` prop.
- **Decision**: Strictly standardize on `@base-ui/react` and use `render={<Button ... />}` composition.
- **Rationale**: Radix `asChild` creates cloneElement collisions and fragile prop merging. Base UI provides cleaner DOM control and native React 19 compatibility.

### ADR-003: Strict Event Bus Decoupling via `@hono-commerce/queue`

- **Context**: Web applications and APIs often import queue runners (like BullMQ or RabbitMQ) directly into route handlers.
- **Decision**: Application packages (`apps/api`, `apps/dashboard`, `apps/storefront`) MUST NEVER import BullMQ directly. All asynchronous side effects must call typed publishers exported from `@hono-commerce/queue`.
- **Rationale**: Decouples the message broker implementation from application logic, allowing pluggable background worker engines without changing web endpoints.

### ADR-004: Centralized Route Catalog over Next.js File-System `typedRoutes`

- **Context**: Next.js 16's `typedRoutes: true` checks routes strictly against physical disk folders (`src/app/(tenant)/[slug]/products`), which fails when using subdomain proxy rewrites (`/products`).
- **Decision**: Turn off `typedRoutes: true` in `next.config.ts` and use `@hono-commerce/types/routes` as the single source of truth for routes.
- **Rationale**: Enables end-to-end type-safe routes (`routes.tenant.products`, `routes.tenant.order({ orderId })`) while eliminating fragile type assertions (`as Route` or `as any`).

### ADR-005: Hono RPC Response Type Inference over Hand-Written DTOs

- **Context**: Hand-crafting TypeScript DTO interfaces or Zod schemas for API responses duplicates backend type definitions and introduces silent drift between backend handler returns and frontend expectations.
- **Decision**: Frontends (`apps/dashboard`, `apps/storefront`) infer endpoint response shapes directly from Hono route definitions using `InferResponseType<typeof apiClient.api.v1.[domain].[endpoint].$[method], 200>` from `hono/client`. `@hono-commerce/types` is strictly reserved for incoming request validation schemas (`zValidator`), route catalogs, and shared domain constants.
- **Rationale**: Guarantees 100% end-to-end type safety and zero drift between backend endpoints and frontend data consumption with zero boilerplate. When backend return shapes change, TypeScript immediately flags mismatches across consuming apps at compile time.

### ADR-006: Vertical Slice & One-File-Per-Handler API Architecture (Zero Backend Route Dictionary)

- **Context**: Backend APIs often fall victim to the "God Service" anti-pattern (multi-thousand line service files containing dozens of unrelated operations) or bloated controllers, paired with fragile hand-written route dictionaries.
- **Decision**:
  1. Organize all backend features into vertical slice modules (`apps/api/src/modules/<domain>/`).
  2. Adopt the **One-File-Per-Handler Pattern** where each HTTP operation lives in its own dedicated, single-responsibility file under `modules/<domain>/handlers/<operation>.ts`, mounted via a declarative `*.routes.ts`.
  3. Never write or maintain manual backend API route dictionaries (`routes.api = { ... }`). The backend Hono router chains into `AppType`, allowing `apiClient = hc<AppType>(...)` to auto-infer the complete API tree, methods, parameters, request bodies, and response types directly from the TypeScript AST. `packages/types/src/routes/catalog.ts` is strictly reserved for Next.js frontend UI page navigation routes.
- **Rationale**: Eliminates bloated multi-thousand line service files, prevents git merge conflicts, ensures localized file ownership and instant debugging, and guarantees 100% end-to-end type safety without redundant route dictionaries.

---

## 3. How to Reference Architecture in Specs

When drafting a new feature specification in `docs/specs/<feature>/spec.md`:

1. Identify the relevant architecture document(s) in the spec header.
2. Ensure data models follow `system-architecture.md` (e.g. `tenantId` on all tenant-scoped tables).
3. Ensure UI components comply with `design-system-guidelines.md`.
