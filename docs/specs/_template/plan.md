# Technical Implementation Plan: [Feature Name]

**Feature ID**: `[NNN-feature-name]`  
**Specification**: `docs/specs/[NNN-feature-name]/spec.md`

---

## 1. Monorepo Package Impact Matrix

| Package / App     |   Impact   | Scope of Changes                                               |
| :---------------- | :--------: | :------------------------------------------------------------- |
| `packages/types`  |  **High**  | Route definitions, Zod request input schemas, domain constants |
| `packages/db`     | **Medium** | New tables, relations, and migrations                          |
| `packages/env`    |  **Low**   | Register new environment variables (if any)                    |
| `packages/queue`  |  **None**  | New job publishers / consumers (if any)                        |
| `apps/api`        |  **High**  | Hono route handlers mounted under `/api/v1/*`                  |
| `apps/dashboard`  | **Medium** | Management UI, forms, and route pages                          |
| `apps/storefront` |  **Low**   | Customer-facing views                                          |

---

## 2. Contracts & Type Definitions (`@hono-commerce/types`)

### A. Centralized Route Catalog Entry (`packages/types/src/routes/catalog.ts`)

```ts
// Example:
// routes.tenant.[feature] = "/[path]"
```

### B. Request Input Schemas (`packages/types/src/[feature].ts`)

> **Note**: Only incoming client requests (`json`, `query`, `param`) require runtime Zod schemas.

```ts
export const CreateFeatureSchema = z.object({
  name: z.string().min(1),
  // other validated input fields...
});
export type CreateFeatureInput = z.infer<typeof CreateFeatureSchema>;
```

### C. Response Types (Inferred via Hono RPC — No Manual DTOs)

> **Architectural Rule (ADR-005)**: Never write redundant manual response DTOs. Response types are automatically inferred directly from Hono route endpoints using `InferResponseType`:

```ts
import type { InferResponseType } from "hono/client";
import type { apiClient } from "@/lib/api-client";

// Inferred return type for HTTP 200:
export type FeatureResponse = InferResponseType<
  typeof apiClient.api.v1.[domain].$get,
  200
>;
```

---

## 3. Database Schema & Migrations (`packages/db`)

### Schema Changes (`packages/db/src/schema/[entity].ts`)

```ts
// export const myTable = pgTable("my_table", {
//   id: text("id").primaryKey(),
//   tenantId: text("tenant_id").notNull().references(() => tenant.id, { onDelete: "cascade" }),
//   ...
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
// });
```

---

## 4. Backend API Design (`apps/api`)

- **Base Route**: `/api/v1/[domain]`
- **Authentication**: `authMiddleware` / `requireTenantSession`
- **Endpoints**:
  - `GET /api/v1/[domain]` $\to$ List items (paginated)
  - `POST /api/v1/[domain]` $\to$ Create item (`zValidator("json", CreateFeatureSchema)`)

---

## 5. Frontend & UI Architecture (`apps/dashboard` / `apps/storefront`)

- **Page Path**: `src/app/(tenant)/[slug]/[feature]/page.tsx`
- **Component Composition**: Uses Base UI primitives from `@hono-commerce/ui/components/*` or composite modules in `@hono-commerce/ui/shared/*`.
- **Data Fetching**: Typed TanStack Query hooks consuming `@hono-commerce/types`.
