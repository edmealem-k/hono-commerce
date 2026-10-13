# Technical Implementation Plan: Relational Queries API Read Refactor

**Feature ID**: `006-rqb-default-read-refactor`  
**Specification**: `docs/specs/006-rqb-default-read-refactor/spec.md`

---

## 1. Monorepo Package Impact Matrix

| Package / App       | Impact | Scope                                                                                                               |
| :------------------ | :----: | :------------------------------------------------------------------------------------------------------------------ |
| `packages/db`       |  Low   | Add Drizzle-only relation metadata if required; convert seed lookup reads. No database schema or migration changes. |
| `apps/api`          | Medium | Convert read operations in tenant, invitation, storage, auth middleware, and user handlers. Preserve Core writes.   |
| `apps/worker`       |  Low   | Convert eligible notification fanout and storage-expiry reads. Preserve Core inserts/updates.                       |
| Other apps/packages |  None  | No frontend, API contract, queue contract, or environment changes.                                                  |

## 2. Query Conversion Strategy

- Use the installed Drizzle `0.45.x` RQB API and current `relations()` declarations.
- Simple table reads become `db.query.<table>.findFirst()` / `findMany()` with explicit `columns`, `where`, `orderBy`, and `limit` options as needed.
- Read joins become relation reads with `with`, then are mapped into the existing flat API/worker shape when consumers expect flat values.
- Add ORM relation definitions only for relationships needed by migrated reads (tenant members/users, notifications preferences, and missing inverse relations if necessary). These definitions do not change the SQL schema and require no migration.
- Keep row reads on RQB. Retain a database-side `COUNT` for unread notifications because RQB would otherwise transfer every matching ID solely to compute the count.
- Use RQB for tenant notification recipients with two scoped reads: first select eligible membership IDs and roles, then select only active users whose IDs match. This prevents inactive user details from being fetched.
- Use separate tenant-scoped RQB reads for an upload attempt and its file so file metadata is not selected before the file tenant predicate is applied.
- Keep all mutations and transaction write operations on Core.
- Keep tenant-specific predicates in the RQB `where` conditions even when traversing relations.

## 3. Files in Scope

- `packages/db/src/schema/auth.ts`, `tenant.ts`, `notification.ts` (relation metadata only, as needed)
- `packages/db/src/seed/admin.ts`
- `apps/api/src/lib/auth/require-tenant.ts`
- `apps/api/src/modules/users/handlers/list-workspaces.ts`, `list-notifications.ts`
- `apps/api/src/modules/tenants/handlers/create-invitation.ts`, `list-invitations.ts`, `resend-invitation.ts`, `cancel-invitation.ts`
- `apps/api/src/modules/invitations/handlers/resolve-invitation.ts`, `update-status.ts`
- `apps/api/src/modules/storage/handlers/report-upload-failure.ts`, `get-preview-url.ts`, `attach-file.ts`, `delete-file.ts`, `detach-file.ts`, `confirm-upload.ts`
- `apps/worker/src/consumers/notification.ts`, `storage.ts`

## 4. Contracts, Data, and API

- No request schema, route, response envelope, job payload, database table, SQL schema, or migration changes.
- Hono endpoint return shapes must remain unchanged.
- Drizzle relations must match existing foreign keys and must not be treated as tenant authorization or isolation by themselves.

## 5. Verification

- Run `bun run verify` per repository guidance.
- Confirm no Core `.select()` calls remain in application, worker, or seed code.
- Do not run database migration commands or build commands.
