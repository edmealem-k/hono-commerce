# Tasks: [Feature Name]

**Feature ID**: `[NNN-feature-name]`  
**Specification**: `docs/specs/[NNN-feature-name]/spec.md`  
**Plan**: `docs/specs/[NNN-feature-name]/plan.md`

---

## Phase 1: Contracts & Type Definitions

- [ ] 1.1 Define route keys in `packages/types/src/routes/catalog.ts`
- [ ] 1.2 Define Zod request input schemas in `packages/types/src/[feature].ts`
- [ ] 1.3 Export types from `packages/types/src/index.ts`
- [ ] 1.4 Validate contracts compile cleanly (`bun run check-types`)

---

## Phase 2: Database Schema & Migrations (if applicable)

- [ ] 2.1 Add table definition in `packages/db/src/schema/[entity].ts`
- [ ] 2.2 Add composite tenant index `(tenant_id, ...)`
- [ ] 2.3 Generate migration (`bun run db:generate`)
- [ ] 2.4 Apply migration (`bun run db:migrate`)

---

## Phase 3: Backend Implementation (`apps/api` / `packages/queue`)

- [ ] 3.1 Register route handler under `/api/v1/[domain]`
- [ ] 3.2 Add request validation via `zValidator`
- [ ] 3.3 Enforce tenant filtering with `where(eq(table.tenantId, tenantId))`
- [ ] 3.4 Wire background jobs or notifications (if applicable)
- [ ] 3.5 Test endpoints locally

---

## Phase 4: Frontend Implementation (`apps/dashboard` / `apps/storefront`)

- [ ] 4.1 Scaffold UI route page inside the appropriate route group
- [ ] 4.2 Compose components using Base UI (`@hono-commerce/ui`)
- [ ] 4.3 Wire form submission and API mutations with inferred response types (`InferResponseType`) and typed error handling
- [ ] 4.4 Verify responsiveness and empty states

---

## Phase 5: Verification & Convergence Gate

- [ ] 5.1 Run TypeScript typecheck: `bun run check-types` (0 errors)
- [ ] 5.2 Run Oxlint and Oxfmt: `bun run check` (0 warnings, 0 errors)
- [ ] 5.3 Run consolidated verification: `bun run verify`
- [ ] 5.4 Verify acceptance scenarios from `spec.md`
