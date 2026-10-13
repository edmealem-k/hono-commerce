# Tasks: Dashboard Workspace Foundation

**Feature ID**: `005-dashboard-workspace-foundation`  
**Specification**: `docs/specs/005-dashboard-workspace-foundation/spec.md`  
**Plan**: `docs/specs/005-dashboard-workspace-foundation/plan.md`

This checklist decomposes the approved specification and implementation plan. Tasks are ordered by dependency. Each task should remain small enough to review independently and must preserve the repository architecture rules.

## Phase 0: Preconditions and audit

- [ ] 0.1 Confirm `spec.md` is Approved for Planning and `plan.md` is accepted before implementation begins.
- [ ] 0.2 Record the current baseline files for dashboard routes, auth/session configuration, proxy, permission helpers, shared sidebar/drawer/split-view components, and notification schema.
- [ ] 0.3 Confirm no database migration is needed; do not create, generate, inspect, apply, or modify migration files.
- [ ] 0.4 Confirm existing Electric Indigo semantic tokens and the approved Light/Dark theme decision in `packages/ui/DESIGN.md` and dashboard design guidance.

## Phase 1: Shared contracts and permissions

- [ ] 1.0 Confirm every feature form has a shared shadcn/Base UI control, React Hook Form state, a shared Zod schema, and a TanStack Query mutation when it changes server state.

- [x] 1.1 Define the canonical permission key union and registry for platform and tenant permissions.
- [x] 1.2 Update the role-to-permission map so platform admin, platform staff, tenant owner, and tenant member resolve through the canonical helper.
- [x] 1.3 Add `MODERATION:READ`, `QUEUES:READ`, and `PLATFORM:SETTINGS` without exposing routes that do not yet exist.
- [x] 1.4 Remove or redirect duplicate permission maps in `packages/ui/src/shared/auth/permission-gate.tsx`.
- [x] 1.5 Add workspace request schemas under `packages/types/src/schemas/workspace.ts`.
- [x] 1.6 Add notification list, notification ID, and read-state request schemas under `packages/types/src/schemas/notification.ts`.
- [x] 1.7 Export the new schemas and permission types through the appropriate package index files.
- [x] 1.8 Accept either a validated UUID or DNS-safe tenant slug for workspace tenant identifiers.
- [ ] 1.9 Add only the approved dashboard UI route keys to `packages/types/src/routes/catalog.ts`; do not add API paths there.
- [ ] 1.10 Verify the contracts compile without response DTOs, `any`, `unknown`, or type-silencing assertions.

## Phase 2: Better Auth, session, and host safety

- [x] 2.1 Configure the Better Auth session extension so effective platform permissions are attached at the session boundary.
- [x] 2.2 Add the matching Better Auth client/session typing and ensure dashboard consumers can read the resolved permission array.
- [x] 2.3 Audit cookie attributes, trusted origins, and cross-subdomain settings for local and production URLs using existing typed environment variables.
- [x] 2.4 Add or update env schema/example entries only if the audit identifies a genuinely missing variable; do not reference raw undeclared environment variables.
- [x] 2.5 Refactor `require-permission` to use the canonical permission helper instead of inline role-name checks.
- [x] 2.6 Refactor tenant context resolution to use verified context and canonical permissions.
- [x] 2.7 Replace the production queue-monitoring role check with `QUEUES:READ`; keep any development bypass explicit and non-production.
- [x] 2.8 Harden dashboard proxy handling: strip untrusted tenant headers, set verified context only after validation, preserve root hub routing, and reject malformed tenant hosts.
- [x] 2.9 Verify safe auth callback/redirect behavior for anonymous and authenticated requests.

## Phase 3: API vertical slices

### Users and workspaces

- [x] 3.1 Create `apps/api/src/modules/users/` module structure with one handler per operation and a declarative routes file.
- [x] 3.2 Implement `GET /api/v1/users/me/workspaces` using the authenticated user’s tenant memberships and platform eligibility.
- [x] 3.3 Ensure the workspace list contains structural identity/role data only and never fabricated metrics.
- [x] 3.4 Mount the users router under `/api/v1` and preserve the exported `AppType`.

### Tenant workspace

- [x] 3.5 Implement `GET /api/v1/tenants/:tenantId/workspace` in a focused tenant handler.
- [x] 3.6 Apply authentication, verified tenant context, tenant-read permission, and tenant-scoped query filtering.
- [x] 3.7 Return the standard success/error envelope through `ok`, `fail`, and validation helpers.

### Notifications

- [x] 3.8 Implement `GET /api/v1/users/me/notifications` with bounded pagination, recent items, and unread count.
- [x] 3.9 Implement `PATCH /api/v1/users/me/notifications/:notificationId` for read-state changes only.
- [x] 3.10 Enforce authenticated-user ownership and tenant scope where notification records contain tenant context.
- [x] 3.11 Sanitize or reject notification action URLs outside approved application origins.
- [x] 3.12 Do not implement mark-all, delete, WebSocket delivery, or a view-all inbox route in this feature.
- [x] 3.13 Verify all API responses use the standard envelope and that no manual response DTOs are introduced.
- [x] 3.14 Verify generated Hono client methods and response inference from `AppType`.

## Phase 4: Shared UI systems (`packages/ui`)

### Workspace shell

- [x] 4.1 Create `shared/workspace-shell/` types and route-agnostic shell composition.
- [x] 4.2 Implement `WorkspaceHeader` with title/breadcrumb content and explicit notification/account/appearance action slots.
- [x] 4.3 Implement `WorkspaceBreadcrumbs` with accessible labels and a neutral root state.
- [x] 4.4 Implement shared shell loading skeletons without layout shift.
- [x] 4.5 Ensure the shared header has no search, command, chat, or AI affordance.

### Notifications and appearance

- [x] 4.6 Create notification panel, unread badge, item, empty, loading, error, and expired presentations.
- [x] 4.7 Render notification action links only after safe-origin validation and preserve focus behavior.
- [x] 4.8 Create the appearance panel using a Light/Dark toggle group only.
- [x] 4.9 Ensure first visit follows the device scheme internally while never rendering “System” as an option.
- [x] 4.10 Preserve Electric Indigo and semantic status tokens regardless of appearance choice.

### Drawer, multistep, and modal foundations

- [x] 4.11 Extend `GlobalDrawer`/`useDrawer` with a close-request guard, stable stack behavior, Escape handling, and focus return.
- [x] 4.12 Define a typed multistep drawer contract with current step, navigation guards, submit state, and close-request handling.
- [x] 4.13 Reuse existing Base UI Sheet/Dialog primitives and remove inline z-index/layout coupling from the new behavior.
- [x] 4.14 Preserve existing `GlobalModal`, `ConfirmDialog`, `GlobalSplitView`, and responsive content-sidebar APIs.
- [x] 4.15 Verify shared UI uses Base UI `render`, semantic tokens, and no raw HTML controls where primitives exist.
- [ ] 4.16 Verify all form surfaces use `Field`/`FieldGroup`, visible labels, `zodResolver`, and typed TanStack Query mutations; reject ad-hoc payload construction.

## Phase 5: Dashboard API/bootstrap and hub

- [x] 5.0 Apply the colocated ownership rule: keep the workspace hub under `app/_components`, public auth-only composites under `app/(public)/_components`, and tenant/admin shell composites beside their owning layouts; retain only cross-route infrastructure in `src/components` and `src/lib`.

- [x] 5.1 Add `apps/dashboard/src/lib/api-server.ts` that forwards request cookies, forwards only verified tenant context, and uses `cache: "no-store"` for session/workspace bootstrap.
- [x] 5.2 Add typed TanStack Query hooks for workspaces and notifications using generated endpoint inference.
- [x] 5.3 Replace scaffold `apps/dashboard/src/app/page.tsx` with the always-visible workspace manager hub.
- [x] 5.4 Render authorized workspace cards with identity, type/role, enter action, and only real overflow actions.
- [x] 5.5 Add the `Add Workspace` trigger and connect it to the future-compatible multistep drawer entry point without implementing tenant creation logic.
- [x] 5.6 Add the account menu with Personal Workspace, Workspaces, conditional Admin via `PLATFORM:READ`, and Sign Out.
- [x] 5.7 Add notification and appearance actions to the hub header; omit search.
- [x] 5.8 Implement hub Initial, Loading, Success, Empty, Error, and Expired states.
- [x] 5.9 Confirm the hub never auto-redirects when exactly one authorized workspace exists.

## Phase 6: Tenant and platform shells

- [x] 6.1 Replace the duplicated tenant aside with the shared workspace/sidebar shell.
- [x] 6.2 Add a structural tenant home page with no fabricated aggregate metrics.
- [x] 6.3 Add tenant route metadata for breadcrumbs and active navigation.
- [x] 6.4 Replace the duplicated admin aside with the shared workspace/sidebar shell.
- [x] 6.5 Add a structural admin home page guarded by platform permission.
- [x] 6.6 List only implemented tenant/admin destinations; omit chat, billing, settings, moderation, queue, and platform-settings links until their contracts exist.
- [x] 6.7 Verify tenant context is derived from the route/proxy context and is not drilled through unrelated component layers.

## Phase 7: Authentication experience

- [x] 7.1 Update the public auth layout/sign-in page to the restrained two-column desktop composition.
- [x] 7.2 Use the existing static login visual asset without carousel behavior or fabricated marketing content.
- [x] 7.3 Collapse to a single-column mobile layout with the form remaining primary.
- [x] 7.4 Reuse shared field/form primitives and existing auth request schemas.
- [x] 7.5 Cover auth Initial, Loading, Success, Empty/not-applicable, Error, and Expired states without layout shift.
- [x] 7.6 Verify safe post-auth routing returns users to the hub or an explicitly requested authorized destination.

## Phase 8: Responsive, accessibility, and visual convergence

- [x] 8.1 Verify desktop, tablet, and mobile hub header actions and panels.
- [x] 8.2 Verify notification and appearance popovers become accessible sheets on narrow screens.
- [x] 8.3 Verify Add Workspace drawer becomes a full-height mobile sheet and preserves form state.
- [x] 8.4 Verify drawer close guards, confirm dialogs, Escape behavior, and focus return.
- [x] 8.5 Verify keyboard navigation, focus visibility, labels, `aria-expanded`, `aria-controls`, and wizard progress announcements.
- [x] 8.6 Verify reduced-motion behavior and no forced animation.
- [x] 8.7 Review all changed UI against `packages/ui/DESIGN.md` and dashboard design guidance for semantic tokens, fixed accent, density, and no arbitrary colors.

## Phase 9: Verification and acceptance

- [x] 9.1 Run `bun run check-types` and resolve all type errors.
- [x] 9.2 Run `bun run check` and resolve all lint/format issues without broad unrelated rewrites.
- [x] 9.3 Run `bun run verify` with zero warnings and zero errors; do not run a build.
- [ ] 9.4 Verify anonymous auth scenarios, including invalid/expired states and safe redirects. _(Requires a live browser/session.)_
- [ ] 9.5 Verify zero-, one-, and multi-workspace hub scenarios; root hub remains visible in all cases. _(Requires live authorized fixtures.)_
- [x] 9.6 Verify platform admin/staff/member account-menu and route behavior through permissions rather than role-name checks.
- [x] 9.7 Verify notification unread/read behavior, polling/focus refresh, empty/error states, and action-link safety.
- [x] 9.8 Verify Light/Dark behavior: first visit follows device scheme, only two choices render, explicit selection persists, and no reset-to-system action exists.
- [x] 9.9 Verify no database schema or migration files changed and no fabricated production metrics were added.
- [x] 9.10 Record evidence for each acceptance scenario in the implementation handoff.

## Explicitly prohibited or deferred tasks

- [ ] Do not generate, edit, inspect, apply, or commit Drizzle migrations.
- [ ] Do not add real tenant-creation business logic in this feature.
- [ ] Do not add aggregate sales/order/catalog/analytics endpoints or fabricated dashboard metrics.
- [ ] Do not add support chat, platform chat, WebSocket notifications, notification inbox, moderation UI, queue UI, or platform settings UI.
- [ ] Do not introduce a second permission registry, manual API route dictionary, manual response DTO, raw environment variable, `any`, `unknown`, or type assertion workaround.
- [ ] Do not use raw HTML form controls or unvalidated ad-hoc form state where shared shadcn/Base UI, React Hook Form, and Zod contracts apply.
