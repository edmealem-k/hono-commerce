# Technical Implementation Plan: Dashboard Workspace Foundation

**Feature ID**: `005-dashboard-workspace-foundation`  
**Specification**: `docs/specs/005-dashboard-workspace-foundation/spec.md`  
**Status**: Ready for task decomposition; implementation must not begin until this plan is accepted.

## 1. Outcome and current-state baseline

This plan replaces the scaffolded dashboard experience with a real workspace hub, reusable workspace shell, tenant shell, platform-admin entry point, notification center, appearance panel, and two-column authentication layout. It also establishes the drawer and multistep-flow contracts that later features will consume.

The current app has duplicated hand-written tenant/admin asides, demo pages with fabricated metrics, a root portal selector, a `ModeToggle` that exposes System, and shared drawer/split-view primitives without a coordinated close-guard contract. The plan composes those existing primitives rather than creating a second UI system.

The first iteration is structural. It must not invent aggregate sales, order, catalog, or analytics data, and it must not add or run a database migration.

## 2. Monorepo package impact matrix

| Package / app                    | Impact | Planned scope                                                                                                                            |
| -------------------------------- | :----: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types`                 |  High  | Canonical permission keys, workspace/notification input schemas, dashboard route catalog entries.                                        |
| `packages/db`                    |  None  | Reuse existing tenant, tenant-member, user/session, and notification tables; no schema or migration work.                                |
| `packages/env`                   |  Low   | Reuse existing URLs/domains; add a typed variable only if deployment verification proves one is required.                                |
| `packages/auth`                  |  High  | Central permission registry, Better Auth custom session fields, trusted-origin/cookie audit.                                             |
| `packages/ui`                    |  High  | Shared workspace header, breadcrumbs, notification presentation, appearance panel, drawer-flow contracts, and responsive shell adapters. |
| `apps/api`                       |  High  | Users/workspaces and user-notifications modules; workspace detail endpoint; permission guard cleanup.                                    |
| `apps/dashboard`                 |  High  | Hub, tenant/admin shells, auth layout, route-aware breadcrumbs, API bootstrap, responsive behavior, and removal of demo-only navigation. |
| `apps/storefront`                |  None  | No storefront behavior is part of this feature.                                                                                          |
| `packages/queue` / `apps/worker` |  None  | No notification queue or background job is introduced; notification reads use existing persisted data.                                   |

## 3. Architecture decisions

### 3.1 Shell ownership

- Atomic controls stay in `packages/ui/src/components/*`.
- Reusable product systems go in `packages/ui/src/shared/*`.
- Dashboard route groups own only composition, route data, permissions, and API loading. They must not duplicate the shell markup.
- The workspace hub is a first-class root page and is always shown. A single authorized tenant never auto-redirects.
- The hub header exposes only the approved actions: notification bell, account menu, and appearance. Search, command palette, chat, and AI controls are intentionally absent.

### 3.2 Permission resolution

- Define one canonical permission vocabulary. UI gates consume resolved permissions, never inline role checks.
- Platform permissions are resolved at the Better Auth session boundary and attached to the session user. Tenant permissions are resolved from the selected tenant membership and are never unioned across tenants.
- `PLATFORM:READ` controls the Admin account-menu item. `MODERATION:READ`, `QUEUES:READ`, and `PLATFORM:SETTINGS` are reserved for their eventual real routes and are not shown as dead navigation.
- `PLATFORM:SUPPORT` and chat permissions are not implemented in this feature.

### 3.3 Theme behavior

- The appearance UI displays only Light and Dark.
- An unset preference follows `prefers-color-scheme` on first visit; the word “System” is never rendered as a selectable option.
- Selecting Light or Dark persists the explicit preference. There is no reset-to-system action.
- Electric Indigo remains the fixed brand accent. Status colors remain semantic and are not user-selectable.

### 3.4 Better Auth and host boundaries

Use Better Auth’s session extension point to attach permissions once and use its cookie/trusted-origin configuration for the dashboard/API deployment shape. Official references: [custom session fields](https://better-auth.com/docs/concepts/session-management), [cookie configuration](https://better-auth.com/docs/concepts/cookies), and [security options](https://better-auth.com/docs/reference/security).

The proxy must strip untrusted tenant headers, derive tenant context only from a verified host/path, prevent the root hub from falling through to `[slug]`, and preserve safe auth callback behavior. Do not introduce a second auth provider or a client-only authorization model.

## 4. Contracts and type definitions (`packages/types`)

### 4.1 Permission constants

Create a typed permission registry and role-to-permission map in the shared auth domain (or re-export the canonical registry from `packages/auth`). The initial keys are:

`PLATFORM:READ`, `PLATFORM:SUPPORT`, `PLATFORM:SETTINGS`, `MODERATION:READ`, `QUEUES:READ`, `TENANT:READ`, `TENANT:UPDATE`, `MEMBERS:READ`, `MEMBERS:MANAGE`, `CATALOG:READ`, `CATALOG:WRITE`, `ORDERS:READ`, `ORDERS:MANAGE`, `STORAGE:READ`, `ANALYTICS:READ`, `AUDIT:READ`, and `CUSTOMERS:READ`.

Platform admin has the platform wildcard through the canonical helper. Platform staff receives the explicitly approved operational permissions. Merchant owner/member permissions remain tenant-scoped.

### 4.2 Request schemas

Add `packages/types/src/schemas/workspace.ts` for the safe tenant slug-or-UUID route parameter and any bounded workspace-list query. Tenant slugs must be lowercase DNS-safe identifiers with a maximum length of 63 characters. Add `packages/types/src/schemas/notification.ts` for list pagination, UUID notification parameters, and the `{ isRead: boolean }` update body. All limits are bounded and identifiers are validated before reaching handlers.

Do not create response DTOs. Frontend types must use `InferResponseType` from the generated Hono client.

### 4.3 Route catalog

Add only the dashboard UI routes needed for the hub, tenant home, admin home, and auth entry points. Do not put API endpoints in `packages/types/src/routes/catalog.ts`. Do not add a “view all notifications” route until a real notification inbox exists.

## 5. Database and migration boundary

No table, column, index, relation, or migration changes are planned. The API will reuse:

- tenant and tenant-member records for authorized workspace cards;
- user/session records for identity and session permissions;
- the existing notification table for unread counts, recent notifications, read state, and safe action URLs.

Every tenant-scoped notification query must include both the authenticated user and tenant scope where applicable. The implementation must not fabricate dashboard metrics or seed placeholder production data.

## 6. Auth, session, and proxy work

1. Refactor `packages/auth/src/permissions.ts` into the canonical registry, add the missing moderation/queue/platform-settings keys, and remove duplicated UI role maps.
2. Configure Better Auth’s custom session response so the effective platform permission array is available to the dashboard and API without per-render permission queries. Keep the existing role taxonomy (`admin`, `staff`, `owner`, `member`) and resolve tenant membership separately.
3. Update the Better Auth client with the matching session plugin/type surface.
4. Audit `advanced.defaultCookieAttributes`, trusted origins, and cross-subdomain behavior for local development and production. Do not force production-only `secure` behavior onto localhost. Reuse existing typed URL/domain variables; add env schema/example entries only when necessary.
5. Replace inline `user.role === "admin"` checks in `require-permission`, tenant resolution, and queue monitoring with the canonical permission helper. Queue monitoring requires `QUEUES:READ` in production; development bypasses must remain explicit and test-only.
6. Harden `apps/dashboard/src/proxy.ts`: strip incoming context headers, set verified context headers only after host validation, keep `/` on the workspace hub, and reject ambiguous or malformed tenant hosts before route rewriting.

## 7. API implementation (`apps/api`)

### 7.1 Users/workspaces module

Create `apps/api/src/modules/users/` with a declarative router and one handler per operation:

- `GET /api/v1/users/me/workspaces` — list the caller’s authorized tenant destinations and platform eligibility for the hub. This is session/membership data only, not metrics.

Mount the router from the root `/api/v1` chain and export it through `AppType`.

### 7.2 Workspace detail

Add `apps/api/src/modules/tenants/handlers/get-workspace.ts` and map it from `tenants.routes.ts`:

- `GET /api/v1/tenants/:tenantId/workspace` — authenticate, resolve tenant context, require tenant read permission, and return the structural workspace identity needed by the tenant shell.

Use `validated`, `ok`, `paginated`, and `fail`; never return ad-hoc envelopes.

### 7.3 Notifications

Create `apps/api/src/modules/users/handlers/list-notifications.ts` and `update-notification-read-state.ts`:

- `GET /api/v1/users/me/notifications` — return recent notifications and unread count for the authenticated user, with bounded pagination.
- `PATCH /api/v1/users/me/notifications/:notificationId` — update only the caller’s read state after ownership checks.

Do not add mark-all, delete, or inbox routes in this phase. Sanitize or reject action URLs that leave approved application origins. Use the existing notification indexes and standard response helpers.

## 8. Shared UI architecture (`packages/ui`)

Create the following shared systems, keeping props data-oriented and route-agnostic:

- `shared/workspace-shell/`: `WorkspaceShell`, `WorkspaceHeader`, `WorkspaceHeaderActions`, `WorkspaceBreadcrumbs`, loading skeleton, and shared types. The header has explicit slots for title/breadcrumbs and notification/account/appearance actions; it has no search slot.
- `shared/notifications/`: notification button/panel, unread badge, item, empty/loading/error states, and safe action-link rendering. Data fetching remains in the dashboard app.
- `shared/appearance/`: Light/Dark toggle group and panel content. It must not expose System or reset-to-system.
- `shared/drawer/`: extend the existing global drawer contract with a close guard, stable stack layering, focus return, Escape handling, and a multistep wizard mode. Reuse `Sheet`/Base UI primitives and avoid inline z-index styling.
- `shared/split-view/`: preserve the existing split-view API for future inspectors/chat; do not add chat UI now.
- `shared/modal/`: continue using the existing modal/confirm primitives for destructive actions.

The existing `ResponsiveContentSidebarLayout`, `SidebarProvider`, `TenantSwitcher`, `GlobalDrawer`, `GlobalModal`, and `GlobalSplitView` are the foundation. New components must not replicate their behavior.

## 9. Dashboard application composition

### 9.1 API bootstrap

Create `apps/dashboard/src/lib/api-server.ts` as a server-side dashboard API factory. It must forward the incoming request cookie, forward only verified tenant context, use `cache: "no-store"` for session/workspace/notification bootstrap data, and keep endpoint return types inferred from `AppType`. Client TanStack Query hooks may hydrate from that bootstrap and use the existing 30-second stale time. Do not expose auth credentials to the browser.

### 9.2 Hub

Replace `apps/dashboard/src/app/page.tsx` with the workspace manager page:

- header title `Workspace Manager`;
- authorized workspace cards with logo/avatar, name, type/role, enter action, and overflow action only when a real action exists;
- an `Add Workspace` action that opens the future-compatible multistep drawer entry point (its creation logic may remain deferred);
- account menu with Personal Workspace, Workspaces, conditional Admin, and Sign Out;
- notification center and appearance panel;
- responsive single-column fallback on small screens.

The hub must have explicit initial/loading/empty/error/expired states and no fabricated metrics.

### 9.3 Tenant and admin shells

Replace duplicated asides in `(tenant)/[slug]/layout.tsx` and `(admin)/admin/layout.tsx` with the shared shell and sidebar primitives. Add structural tenant and admin home pages so the shell has real landing destinations. Navigation must list only implemented routes. Omit tenant support chat, billing, settings, platform chat, and platform settings until their route/permission contracts exist.

Breadcrumbs are rendered by the shared workspace header and derive labels from route metadata; the root hub shows no misleading tenant breadcrumb.

### 9.4 Auth page

Update the public auth layout/sign-in flow to a restrained two-column desktop layout using the existing static SVG visual. The form remains the primary interaction, the visual is non-interactive, and mobile collapses to a single column. Reuse shared field primitives and the existing auth schemas. Cover loading, invalid, expired, and success states without layout shift.

## 10. Drawer, multistep, and responsive behavior

- The Add Workspace trigger opens a right-side wizard drawer on desktop and a full-height sheet on mobile.
- Wizard steps expose `currentStep`, `canGoBack`, `canGoNext`, `isSubmitting`, and `onRequestClose`; unsaved changes require a confirm modal before close.
- Step transitions preserve form state and announce progress to assistive technology. Completion returns to the hub and refreshes the workspace query.
- Notification and appearance panels use anchored popovers on wide screens and sheets on narrow screens.
- Existing responsive content sidebars remain sticky/collapsible on desktop and become floating sheet triggers on mobile.
- Respect reduced-motion preferences and ensure keyboard focus returns to the trigger that opened each panel.

## 11. Six-state and accessibility matrix

Every interactive feature must explicitly cover Initial, Loading, Success, Empty, Error, and Expired states. Verify keyboard navigation, visible focus, dialog/sheet labelling, `aria-expanded`/`aria-controls`, contrast against semantic tokens, touch targets, and screen-reader announcements for unread counts and wizard progress.

## 12. Verification strategy

### Automated

- Run `bun run verify` (oxlint, oxfmt check, and all package type checks). Do not run a build.
- Add route/handler tests using the project’s established test tooling when available; otherwise verify through typed compilation and request-level checks without introducing a new test framework in this feature.
- Confirm no migration command or migration file is changed.

### Manual/browser checks

- Anonymous user: auth page, invalid/expired states, and safe redirect behavior.
- Authenticated user with zero, one, and multiple tenants: hub always remains visible; Add Workspace is present; no auto-redirect.
- Platform admin/staff/member: Admin menu and admin routes follow permissions, not role-name checks.
- Notifications: unread badge, empty state, read update, polling/focus refresh, and safe action links.
- Appearance: first visit follows device scheme; only Light/Dark appear; explicit choice persists; Electric Indigo remains fixed.
- Responsive widths: desktop, tablet, and mobile hub, header panels, tenant shell, admin shell, drawer, and multistep flow.

## 13. Ordered implementation phases and gates

### Phase A — contracts and auth foundation

Canonical permissions, session fields, auth client typing, proxy hardening, request schemas, and route catalog entries. **Gate:** type checks pass and no UI depends on duplicated role maps.

### Phase B — API vertical slices

Users/workspaces, workspace detail, and notifications handlers/routes with standard envelopes and ownership checks. **Gate:** generated Hono client exposes all intended methods and no manual response DTOs exist.

### Phase C — shared shell systems

Workspace header/breadcrumbs, notifications presentation, appearance panel, drawer close guard, and multistep contracts. **Gate:** shared package type checks and accessibility review pass.

### Phase D — dashboard route composition

Hub, tenant shell/home, admin shell/home, account menu, query bootstrap, and removal of scaffold navigation/metrics. **Gate:** hub behavior and permission matrix pass manual checks.

### Phase E — auth and responsive convergence

Two-column auth visual, mobile layouts, six-state coverage, focus/reduced-motion behavior, and visual token review. **Gate:** desktop/tablet/mobile checks pass.

### Phase F — convergence

Run `bun run verify`, review changed files, confirm no migrations or fabricated metrics, and update the task checklist with evidence. **Gate:** zero warnings and zero errors.

## 14. Human-only and deferred work

- A human must review Better Auth cookie/trusted-origin settings against deployment topology before production rollout.
- A human owns all Drizzle migration generation, review, and application; this feature intentionally has no schema change.
- Tenant creation business logic, invitations, real aggregate dashboard metrics, notification inbox, support chat, moderation screens, queue UI, and platform settings remain separate follow-up features.

## 15. Completion criteria

This plan is complete when the approved spec has a one-to-one implementation path, each API/UI boundary names an owning package, the hub/header/theme/permission decisions are unambiguous, drawer and multistep behavior is defined, responsive and six-state requirements are testable, and the implementation sequence has verification gates. The next SDD artifact is `tasks.md`; implementation begins only after those ordered tasks are accepted.
