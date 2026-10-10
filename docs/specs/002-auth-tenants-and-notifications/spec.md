# Feature Specification: Auth, Multi-Tenancy, and Notification Engine

**Feature ID**: `002-auth-tenants-and-notifications`  
**Status**: `Draft`  
**Architecture Reference**: `docs/architecture/authentication-architecture.md`, `docs/architecture/system-architecture.md`  
**Target Packages & Apps**: `packages/db`, `packages/auth`, `packages/notification`, `packages/queue`, `packages/types`, `apps/dashboard`, `apps/worker`, `apps/api`

---

## 1. Overview & Objective

This feature establishes the end-to-end foundation for multi-tenant identity, workspace governance, and role-targeted notifications across `hono-commerce`:

1. **Magic Link Authentication & User Lifecycle**:
   - Completely eliminates passwords in favor of passwordless, cryptographic magic links powered by Better Auth and BullMQ transactional emails.
   - Core `user` entity with platform role taxonomy (`admin`, `staff`, `customer`) and explicit account lifecycle status (`active`, `suspended`, `deactivated`).
2. **Multi-Tenant Workspace & Member Governance**:
   - Core `tenant` entity with status indicators (`active`, `suspended`, `maintenance`).
   - Explicit `tenant_member` states (`active`, `suspended`) and merchant role taxonomy (`owner` vs `member`).
   - Stateless, cryptographically signed JWT invitation tokens where expiration is self-contained in the JWT payload (eliminating redundant `expiresAt` database columns).
3. **Persistent Notifications & Role-Targeted Fan-Out**:
   - Persistent `notification` and `notification_preference` database tables for in-app history, unread badge counters, and channel muting.
   - Smart HTTP Polling via TanStack Query (`refetchInterval: 30000`, `refetchOnWindowFocus: true`) in `apps/dashboard` header notification center—eliminating persistent WebSocket infrastructure overhead for standard alert bells.
   - Asynchronous BullMQ worker fan-out for external email/push delivery targeting specific roles without blocking API request threads.
4. **Public Auth & Invitation Acceptance Pages**:
   - Clean, accessible entry points in `apps/dashboard/(public)` for `/sign-in`, `/verify`, and `/invitations/[invitationId]`.

---

## 2. User Stories & Acceptance Scenarios

### User Story 1: Passwordless Sign-In via Magic Link

> As a **user**,  
> I want to **enter my email and receive an instant sign-in link**,  
> So that **I can securely log in without passwords or verification hoops**.

- **Scenario 1.1 (Request Magic Link)**:
  - **Given** a user navigates to `http://localhost:3002/sign-in`
  - **When** entering `merchant@store.com` and submitting
  - **Then** Better Auth dispatches a `magic-link` job to BullMQ queue `emails`, and the UI transitions to a "Check your email" confirmation card.
- **Scenario 1.2 (Verify & Session Establishment)**:
  - **Given** the user clicks the magic link in their email (`http://localhost:3002/verify?token=...`)
  - **When** the page verifies the token with Better Auth
  - **Then** a session cookie is set, user `emailVerified` is guaranteed true, and they are redirected to their workspace or store selector.

### User Story 2: Workspace Team Invitations with JWT Tokens

> As an **invited merchant staff member**,  
> I want to **open my invitation link, review the store details, and accept the role**,  
> So that **I can collaborate on the store workspace**.

- **Scenario 2.1 (Valid Invitation Token)**:
  - **Given** an invitation link with a signed JWT token
  - **When** the user visits `http://localhost:3002/invitations/[invitationId]`
  - **Then** the page decodes the JWT, verifies cryptographic signature and expiration (`exp`), and displays the store identity, status pill, and assigned role badge (`owner` or `member`).
- **Scenario 2.2 (Expired JWT Token)**:
  - **Given** an invitation token where `exp` timestamp is in the past
  - **When** the page attempts verification
  - **Then** the page renders an expired alert card ("This invitation has expired") with an action to contact the store owner.
- **Scenario 2.3 (Accept Invitation & Status Transition)**:
  - **Given** an authenticated user clicks "Accept Invitation"
  - **When** the frontend dispatches `PATCH /api/v1/invitations/:invitationId` with `{ status: "accepted", token }`
  - **Then** a `tenant_member` record is created with `status: "active"`, `tenant_invitation.status` transitions atomically from `pending` to `accepted`, and they are redirected to the store dashboard.
- **Scenario 2.4 (Reject / Decline Invitation)**:
  - **Given** an invitee clicks "Decline" on the invitation card
  - **When** the frontend dispatches `PATCH /api/v1/invitations/:invitationId` with `{ status: "rejected", token }`
  - **Then** `tenant_invitation.status` transitions atomically from `pending` to `rejected`, no membership is activated, and the UI displays a confirmation ("Invitation declined").
- **Scenario 2.5 (Replay & Revocation Defense)**:
  - **Given** an invitation that has already been accepted, rejected, or canceled by the owner
  - **When** an actor attempts to resolve the invitation token again via `PATCH /api/v1/invitations/:invitationId`
  - **Then** the mutation fails with `409 Conflict` ("Invitation has already been resolved or canceled"), preventing token reuse.

### User Story 3: Role-Targeted Tenant & System Notifications

> As a **store owner or administrator**,  
> I want to **dispatch notifications targeted exclusively to specific roles (e.g. owners for billing, all members for orders)**,  
> So that **recipients receive only relevant operational alerts without notification fatigue**.

- **Scenario 3.1 (Role-Scoped In-App Delivery)**:
  - **Given** `notifyTenant("TENANT_ORDER_CREATED", { tenantId: "store_1", targetRoles: ["owner"], data })`
  - **When** `channels.inApp` is evaluated
  - **Then** the notification is persisted to the `notification` database table with `tenantId` and target role criteria.
  - **And** the dashboard notification bell refetches via TanStack Query on its polling interval (or immediately on window focus), displaying updated unread counts to matching store members.
- **Scenario 3.2 (Asynchronous Worker Fan-Out for External Channels)**:
  - **Given** `notifyTenant` is called with `channels.email = true` and `targetRoles = ["owner"]`
  - **When** dispatched from the API handler
  - **Then** the API responds in $<20\text{ms}$ by enqueuing a fan-out job to BullMQ; the background worker queries active members (`status = 'active'`) with role `owner`, checks user preferences, and queues individual `enqueueEmail` jobs.

---

## 3. Invariants & Guardrails (RFC 2119)

1. **`MUST NOT`**: The platform MUST NOT store, accept, or process passwords. All authentication MUST flow through cryptographic magic links.
2. **`MUST NOT`**: The database `tenant_invitation` table MUST NOT store an `expiresAt` column. Token expiration MUST be self-contained in the cryptographically signed JWT payload (`exp` claim).
3. **`MUST`**: Every tenant entity MUST include a lifecycle status indicator: `status: "active" | "suspended" | "maintenance"`.
4. **`MUST`**: Every tenant membership entity MUST include a status indicator: `status: "active" | "suspended"`.
5. **`MUST`**: External notification fan-out (Email/Push) for tenant-wide or role-targeted alerts MUST be executed asynchronously inside `apps/worker` via BullMQ, never synchronously within API request threads.
6. **`MUST`**: Public authentication pages (`/sign-in`, `/verify`, `/invitations/*`) MUST bypass Next.js tenant subdomain rewrites in `apps/dashboard/src/proxy.ts`.
7. **`MUST`**: In-app notification bells and unread badges in `apps/dashboard` MUST use Smart HTTP Polling (TanStack Query with `refetchInterval: 30000` and `refetchOnWindowFocus: true`) against the persistent database API, eliminating unnecessary persistent WebSocket overhead for standard alert bells.
8. **`MUST`**: Invitation status transitions (`pending` $\to$ `accepted` or `rejected`) MUST be executed atomically (`WHERE id = :id AND status = 'pending'`), enforcing single-use and immediate revocation defense.
9. **`MUST`**: Every user entity MUST include an account lifecycle status indicator: `status: "active" | "suspended" | "deactivated"`. Non-active users (`suspended` or `deactivated`) MUST be denied authenticated sessions and rejected with `403 Forbidden`.
10. **`MUST`**: Invitation preview and status transitions MUST use the RESTful resource endpoints `GET /api/v1/invitations/:invitationId?token=...` and `PATCH /api/v1/invitations/:invitationId` (`{ status: "accepted" | "rejected", token }`). Store-level invitation management MUST be nested under `/api/v1/tenants/:tenantId/invitations`.
11. **`MUST`**: Backend API endpoints MUST be organized into vertical slice modules (`apps/api/src/modules/<domain>/`) following the One-File-Per-Handler pattern (`handlers/<operation>.ts`). API routes MUST NOT be declared in manual route dictionaries; all routes, methods, and types MUST be inferred directly via Hono RPC (`AppType` $\to$ `apiClient`).

---

## 4. Security & Compliance

- Magic link tokens are single-use, rate-limited, and expire within 15 minutes.
- Workspace invitations are signed JWTs containing `{ tenantId, email, role, inviterId }` with standard 7-day TTL (`exp`).
- In-app notifications are strictly scoped by `userId` and `tenantId` with cascade deletion upon account or tenant removal.
