# Tasks: Auth, Multi-Tenancy, and Notification Engine

**Feature ID**: `002-auth-tenants-and-notifications`  
**Specification**: `docs/specs/002-auth-tenants-and-notifications/spec.md`  
**Plan**: `docs/specs/002-auth-tenants-and-notifications/plan.md`

---

## Phase 1: Database Schemas & Migrations (`packages/db`)

- [x] 1.1 Update `packages/db/src/schema/auth.ts`: native `uuid("id").primaryKey().defaultRandom()`, platform roles (`userRoleEnum: "admin" | "staff" | "customer"`), and account lifecycle status (`userStatusEnum: "active" | "suspended" | "deactivated"`, `banned`).
- [x] 1.2 Create `packages/db/src/schema/tenant.ts`:
  - `tenant`: native `uuid` PK, `name`, `slug`, `logo`, `status` (`tenantStatusEnum: "active" | "suspended" | "maintenance"`), timestamps.
  - `tenant_member`: native `uuid` PK, `tenantId` (UUID FK), `userId` (UUID FK), `role` (`tenantMemberRoleEnum: "owner" | "member"`), `status` (`tenantMemberStatusEnum: "active" | "suspended"`), timestamps, unique index on `(tenant_id, user_id)`.
  - `tenant_invitation`: native `uuid` PK, `tenantId` (UUID FK), `email`, `role` (`tenantMemberRoleEnum`), `status` (`tenantInvitationStatusEnum: "pending" | "accepted" | "rejected" | "canceled"`), `inviterId` (UUID FK), timestamps, composite index on `(tenant_id, email, status)`.
- [x] 1.3 Create `packages/db/src/schema/notification.ts`:
  - `notification`: native `uuid` PK, `userId` (UUID FK), `tenantId` (UUID FK), `type`, `title`, `message`, `actionUrl`, `metadata`, `isRead`, `readAt`, timestamps.
  - `notification_preference`: native `uuid` PK, `userId` (UUID FK), `enabledChannels`, `mutedNotificationTypes`, timestamps.
- [x] 1.4 Single Source of Truth: Derive shared domain roles and statuses directly from Drizzle `pgEnum` schemas in `packages/types/src/domain/auth.ts`, eliminating duplicate type maintenance.
- [x] 1.5 Export all schema tables and relations from `packages/db/src/schema/index.ts`.
- [x] 1.6 Human developer step: Apply schema to database (`bun run db:push` executed by developer).
- [x] 1.7 Create idempotent and interactive superadmin seeder (`packages/db/src/seed/index.ts`, `packages/db/src/seed/admin.ts`, root `bun run db:seed`).

---

## Phase 2: Notification System & Role-Targeted Fan-Out (`packages/notification`, `packages/queue`, `apps/worker`)

- [x] 2.1 Update `packages/notification/src/types.ts`: strongly type `targetRoles?: MerchantRole[]`, `systemRoles?: PlatformRole[]`, and `idempotencyKey?: string`.
- [x] 2.2 Create `packages/queue/src/jobs/notification.ts` defining domain job schemas for `tenant-notifications-fanout` and `system-notifications-fanout` with `inApp`, `email`, and `push` channels.
- [x] 2.3 Implement consumer in `apps/worker` to resolve active members (`status = "active"`) matching `targetRoles`, check user preferences, batch insert per-recipient in-app notification rows (preserving individual `isRead` states), and dispatch per-user `enqueueEmail` jobs with scoped idempotency keys (`${job.id}:${member.userId}:email`).
- [x] 2.4 Wire `notifyTenant` and `notifySystem` to delegate fan-out through BullMQ worker with parent `idempotencyKey` whenever `inApp`, `email`, or `push` is requested.

---

## Phase 3: Better Auth Configuration, JWT Engine & Modular Backend APIs (`packages/types`, `packages/auth`, `apps/api`)

- [x] 3.1 Install `jose` in `packages/auth` catalog and create `packages/auth/src/jwt.ts` (`signJwt`, `verifyJwt`, `decodeJwtUnsafe`).
- [x] 3.2 Configure Better Auth in `packages/auth/src/index.ts`:
  - Add `advanced.generateId: () => crypto.randomUUID()` to guarantee valid native UUIDv4 primary keys.
  - Configure `magicLink` and `admin` plugins; register `user.additionalFields: { status: { type: "string", defaultValue: "active" } }`.
  - Remove `organization` plugin to eliminate schema impedance mismatches, cleanly owning multi-tenancy and invitations in modular Hono domain modules.
- [x] 3.3 Account enumeration protection: Remove public email existence endpoints and utilize unified passwordless magic-link sign-in with identical user-facing feedback.
- [x] 3.4 Implement storage endpoint security in `apps/api/src/routes/storage.ts`:
  - Add `requireAuth()` to upload and preview endpoints.
  - Strict tenant UUID regex validation on S3 keys (`tenants/{UUID}/{category}/...`).
  - Restrict KYC and legal document previews strictly to store `owner` and platform `admin` roles.
  - Enforce MIME content type validation regex and cap expiration at 3600s.
- [x] 3.5 Implement RBAC and context middleware:
  - `requireAuth`: Enforces `user.status === "active"` and `!user.banned`.
  - `requireTenantContext`: Resolves tenant from `/tenants/:tenantId/...` and verifies active member status.
  - `requirePermission`: Validates permissions against the tenant/user role matrix.
- [x] 3.6 Create shared request schemas in `packages/types/src/schemas/invitation.ts` (`resolveInvitationQuerySchema`, `updateInvitationStatusSchema`, `createInvitationSchema`, `tenantParamSchema`, `cancelInvitationParamSchema`).
- [x] 3.7 Implement `apps/api/src/modules/invitations/` using the One-File-Per-Handler pattern:
  - `handlers/resolve-invitation.ts`: `GET /api/v1/invitations/:invitationId?token=...` with JWT claim vs database cross-validation and `inviterId` check.
  - `handlers/update-status.ts`: `PATCH /api/v1/invitations/:invitationId` requiring active session matching invitation email, executing status transition and `tenant_member` creation in an atomic `db.transaction(...)` with typed `InvitationApiError` status mapping.
  - `invitations.routes.ts`: Declarative route mapping mounting onto root `AppType`.
- [x] 3.8 Implement `apps/api/src/modules/tenants/` for invitation lifecycle management:
  - `handlers/create-invitation.ts`: `POST /api/v1/tenants/:tenantId/invitations` requiring `TEAM:INVITE`, checking existing memberships and pending invites, signing JWT token, and asynchronously enqueuing email notification.
  - `handlers/list-invitations.ts`: `GET /api/v1/tenants/:tenantId/invitations` requiring `TEAM:INVITE`.
  - `handlers/resend-invitation.ts`: `POST /api/v1/tenants/:tenantId/invitations/:invitationId/resend` requiring `TEAM:INVITE`.
  - `handlers/cancel-invitation.ts`: `DELETE /api/v1/tenants/:tenantId/invitations/:invitationId` requiring `TEAM:INVITE`.
  - `tenants.routes.ts`: Declarative router mounted under `/api/v1/tenants` with `requireAuth()` and `requireTenantContext()`.

---

## Phase 4: Frontend UI Routes & Proxy Bypass (`packages/types`, `apps/dashboard`)

- [x] 4.1 Update frontend UI page routes in `packages/types/src/routes/catalog.ts` (`/sign-in`, `/verify`, `/invitations/[invitationId]`) for Next.js navigation (Zero manual backend API route dictionaries).
- [x] 4.2 Update `PUBLIC_PATHS` bypass array in `apps/dashboard/src/proxy.ts` to prevent subdomain rewriting on public auth routes.

---

## Phase 5: Public Auth & Invitation Pages (`apps/dashboard`)

- [x] 5.1 Implement centered card layout in `apps/dashboard/src/app/(public)/layout.tsx` following [`packages/ui/DESIGN.md`](file:///home/edmealem.k/Downloads/hono-commerce/packages/ui/DESIGN.md).
- [x] 5.2 Implement 2-step sliding sign-in card in `/sign-in/page.tsx` with email check, full name entry for new accounts, and magic link dispatch.
- [x] 5.3 Implement `/verify/page.tsx` for magic link callback verification and auto-redirection.
- [x] 5.4 Implement session-aware invitation acceptance in `/invitations/[invitationId]/page.tsx` (Unauthenticated $\to$ CTA to sign-in; Mismatched $\to$ Switch account warning; Matched $\to$ Accept/Decline action buttons).

---

## Phase 6: Verification & Convergence Gate

- [x] 6.1 Run `bun run check` (`oxlint && oxfmt --write`) (0 warnings, 0 errors).
- [x] 6.2 Run `bun run verify` (`oxlint && oxfmt --check && turbo run check-types`) across all 12 monorepo packages.
