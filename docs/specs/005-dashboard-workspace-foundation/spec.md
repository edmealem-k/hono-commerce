# Feature Specification: Dashboard Workspace Foundation

**Feature ID**: `005-dashboard-workspace-foundation`  
**Status**: `Approved for Planning`  
**Architecture References**: `docs/architecture/authentication-architecture.md`, `docs/architecture/routing-and-proxy-architecture.md`, `docs/architecture/design-system-guidelines.md`, `packages/ui/DESIGN.md`, `apps/dashboard/DESIGN.md`  
**Target Packages & Apps**: `packages/types`, `packages/ui`, `apps/api`, `apps/dashboard`

---

## 1. Overview & Objective

This feature replaces the scaffolded merchant and platform dashboard layouts with a production-ready, authenticated workspace foundation. The foundation provides one reusable application frame for tenant workspaces and platform administration while allowing each portal to supply its own navigation, permissions, identity, and page content.

The workspace foundation owns persistent application infrastructure: authenticated workspace resolution, responsive primary navigation, a sticky page header, breadcrumbs, tenant switching, user actions, permission-filtered navigation, contextual right-side content, resizable split views, stacked drawers, global modals, and stable loading and failure states. Individual pages own only their page-specific content and optional contextual sidebar contribution.

The feature also refines the existing public passwordless sign-in presentation and its handoff into the authenticated shell. It does not replace Better Auth, introduce passwords, or redesign the invitation protocol specified by `002-auth-tenants-and-notifications`.

The dashboard base URL is a workspace hub that lists every authorized store and provides the entry point for creating another store. Opening a store navigates to its tenant subdomain, where a deliberately minimal tenant landing surface proves the authenticated shell without introducing analytics, aggregate endpoints, or fabricated commerce data. Existing implemented Products, Orders, Team, and platform pages remain valid destinations and are migrated into the new shell without inventing placeholder domains.

---

## 2. Goals

1. Provide one shared, responsive workspace frame for merchant and platform portals.
2. Resolve session, workspace membership, tenant state, and effective permissions before rendering protected navigation.
3. Make the verified hostname/subdomain the authoritative active-workspace context.
4. Replace duplicated hardcoded `<aside>` layouts with the existing Base UI sidebar system.
5. Expose only routes the current user can access and only routes that actually exist.
6. Mount contextual sidebars, split views, stacked drawers, and modals once at the authenticated shell boundary, including a reusable multi-step workflow architecture for drawer-based forms.
7. Deliver a coherent desktop, tablet, and mobile navigation experience without duplicating navigation markup.
8. Add a workspace hub and minimal tenant landing surface that validate the shell without coupling this feature to commerce aggregates.
9. Refine the magic-link sign-in interface while preserving the existing authentication and invitation contracts.
10. Establish an extensible shell for later catalog, order, inventory, customer, analytics, and platform-governance features.
11. Deliver a purposeful workspace-manager header with shared breadcrumbs, a real notification center, account actions, and persisted appearance controls.

---

## 3. Non-Goals

This feature does not include:

- Implementing new commerce domains such as collections, customer segments, marketing campaigns, or inventory management solely to populate navigation.
- Replacing Better Auth or adding password authentication.
- Changing invitation token issuance, acceptance, rejection, or expiration semantics from specification `002`.
- Redesigning the public storefront or customer portal.
- Building complete Products, Orders, Team, Moderation, or Queue business workflows.
- Implementing tenant support chat or exposing a tenant chat navigation item.
- Implementing store creation forms, mutations, persistence, or onboarding completion; this feature defines only the workspace-hub entry point and future flow contract.
- Building merchant analytics, metric cards, activity feeds, operational queues, aggregate endpoints, or overview data fetching.
- Introducing a manual backend API route dictionary or manual frontend response DTOs.
- Copying a shadcn block unchanged into an app-local component directory.
- Adding database tables or modifying database migrations.
- Adding a command palette as a release blocker. The shell may reserve an extension point for it.
- Building a full notification-inbox page, notification-preference editor, push-notification client, or WebSocket notification transport. This feature implements the header bell and recent-notification surface specified by `002`; a dedicated inbox route may follow separately.
- Adding custom or curated accent selection, density presets, visual-style presets, or user-configurable sidebar modes to the initial appearance panel. The first release is limited to color mode and preserves Hono Commerce's Electric Indigo brand accent.

---

## 4. Personas & Authorization Contexts

| Persona                                     | Context                     | Expected Access                                                                                                                          |
| :------------------------------------------ | :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| Merchant owner                              | Active tenant subdomain     | Full tenant navigation permitted by `session.user.permissions`, including billing, settings, team, catalog, and orders where implemented |
| Merchant member                             | Active tenant subdomain     | Operational tenant navigation permitted by `session.user.permissions`; owner-only destinations remain absent                             |
| Platform admin                              | `admin` subdomain           | Platform governance navigation with unrestricted platform permissions                                                                    |
| Platform staff                              | `admin` subdomain           | Support and operations navigation allowed by platform permissions                                                                        |
| Multi-workspace user                        | Root, tenant, or admin host | May select among authorized tenant workspaces and any authorized platform portal                                                         |
| Authenticated user without dashboard access | Root or protected host      | Receives a clear no-workspace or access-denied state; no protected shell content is leaked                                               |
| Suspended member or user                    | Protected host              | Cannot enter the workspace and receives a non-interactive suspended-access state                                                         |
| Unauthenticated visitor                     | Protected host              | Is redirected to sign-in with a validated return destination                                                                             |

Roles describe account and membership taxonomy, but UI visibility and server authorization are determined by effective permission keys. UI checks are not a substitute for API authorization.

---

## 5. Information Architecture

### 5.1 Merchant Navigation

The initial merchant navigation exposes only current or explicitly specified page routes:

| Group         | Destination    | Route                           | Minimum Permission           |
| :------------ | :------------- | :------------------------------ | :--------------------------- |
| Overview      | Workspace home | `routes.tenant.root`            | Any active tenant membership |
| Commerce      | Products       | `routes.tenant.products`        | `CATALOG:MANAGE`             |
| Commerce      | Orders         | `routes.tenant.orders`          | `ORDERS:MANAGE`              |
| Operations    | Team           | `routes.tenant.team`            | `TEAM:MANAGE`                |
| Configuration | Settings       | `routes.tenant.settings`        | `TENANT:SETTINGS`            |
| Configuration | Billing        | `routes.tenant.settingsBilling` | `TENANT:BILLING`             |

Tenant support chat is outside this feature and MUST NOT appear in the initial navigation. A future chat specification must establish its route, permission contract, and lifecycle behavior before it is exposed.

### 5.2 Platform Navigation

| Group          | Destination        | Route                       | Minimum Permission  |
| :------------- | :----------------- | :-------------------------- | :------------------ |
| Platform       | Tenant oversight   | `routes.admin.tenants`      | `TENANT:READ`       |
| Trust & Safety | Moderation         | `routes.admin.moderation`   | `MODERATION:READ`   |
| Support        | Escalation support | `routes.admin.platformChat` | `PLATFORM:SUPPORT`  |
| Operations     | Background queues  | `routes.admin.queues`       | `QUEUES:READ`       |
| Configuration  | Platform settings  | `routes.admin.settings`     | `PLATFORM:SETTINGS` |

These three permission keys must be added to the canonical permission registry and resolved into the session before their navigation items ship. An undefined permission is not equivalent to public access; a destination whose permission contract is unavailable MUST remain hidden.

### 5.3 Persistent Shell Regions

The authenticated shell contains:

1. **Primary sidebar**: workspace identity, grouped navigation, badges, user footer, icon-collapse rail, and mobile off-canvas behavior.
2. **Sticky header**: context-appropriate sidebar trigger, responsive breadcrumbs or current-page title, page-level actions slot, notification center, account menu, and appearance control. Search and command controls are optional shell extensions and are absent from the workspace hub.
3. **Main content frame**: the single page-scroll owner under normal navigation.
4. **Contextual content sidebar**: optional page-specific information or filters; sticky/collapsible on desktop and a Sheet on mobile.
5. **Global split view**: resizable parallel workspace for chat, document review, and deep inspectors.
6. **Global drawer stack**: transactional forms, create/edit workflows, and narrow detail flows.
7. **Global modal**: confirmations and focused blocking decisions.

---

## 6. User Stories & Acceptance Scenarios

### User Story 1: Authenticated Workspace Entry

> As an **authenticated merchant user**,  
> I want to **enter an authorized store workspace from its subdomain**,  
> So that **I immediately see the correct store identity and permitted navigation**.

- **Scenario 1.1 (Authorized Active Tenant)**:
  - **Given** an authenticated user has an active membership in tenant `acme`
  - **And** tenant `acme` has status `active`
  - **When** the user visits `acme.<root-domain>/`
  - **Then** the system resolves `acme` from the verified hostname context
  - **And** loads the user's membership and effective permissions for that tenant
  - **And** renders the merchant shell with Acme's identity and permitted destinations
  - **And** renders the structural workspace home as the main content without requesting aggregate dashboard data.

- **Scenario 1.2 (Unauthenticated Protected Visit)**:
  - **Given** no valid session exists
  - **When** a visitor opens an authenticated tenant or platform route
  - **Then** the visitor is redirected to `routes.public.signIn`
  - **And** the intended destination is included only as a validated callback URL
  - **And** protected page or workspace data is not rendered before redirect.

- **Scenario 1.3 (Tenant Membership Missing)**:
  - **Given** an authenticated user is not an active member of the hostname tenant
  - **When** the user visits that tenant subdomain
  - **Then** the shell does not render protected navigation or tenant data
  - **And** an access-denied state explains that the user cannot access the store
  - **And** the user may return to the workspace selector or sign out.

- **Scenario 1.4 (Suspended or Maintenance Tenant)**:
  - **Given** the hostname resolves to a tenant with status `suspended` or `maintenance`
  - **When** a member visits the workspace
  - **Then** the normal workspace content is replaced with the corresponding unavailable state
  - **And** mutation actions are absent or disabled
  - **And** the message distinguishes suspension from temporary maintenance.

- **Scenario 1.5 (Suspended Membership or Account)**:
  - **Given** the user's account or tenant membership is not active
  - **When** a protected workspace is requested
  - **Then** access is rejected
  - **And** protected navigation is not briefly exposed during hydration
  - **And** the UI presents the appropriate account or membership recovery guidance.

### User Story 2: Workspace Hub and Selection

> As an **authenticated dashboard user**,
> I want to **see and open my stores from one stable hub**,
> So that **I can choose the correct management context and later create another store**.

- **Scenario 2.1 (Base URL Workspace Hub)**:
  - **Given** an authenticated user has one or more authorized destinations
  - **When** the user visits the dashboard base URL
  - **Then** the system always renders the workspace hub rather than automatically selecting the first or only destination
  - **And** each authorized tenant is represented once with its name, slug or store address, status, deterministic avatar or logo, and an “Open store” action
  - **And** any authorized platform portal is shown as a distinct destination
  - **And** selecting a destination triggers fresh server-side authorization at its tenant or admin origin.

- **Scenario 2.2 (Switch Tenant)**:
  - **Given** the user has access to Acme and Northstar
  - **And** Acme is the current hostname tenant
  - **When** the user selects Northstar from the tenant switcher
  - **Then** navigation uses `toSubdomainUrl("northstar", routes.tenant.root)`
  - **And** the browser moves to the Northstar dashboard origin
  - **And** the new request re-resolves and re-authorizes the workspace server-side.

- **Scenario 2.3 (Single Tenant)**:
  - **Given** the user belongs to one active tenant
  - **When** the user visits the dashboard base URL
  - **Then** the workspace hub displays that single tenant instead of automatically redirecting
  - **And** the future “Create store” location remains consistent with the multi-tenant experience
  - **And** direct visits to the authorized tenant subdomain still enter the tenant workspace immediately.

- **Scenario 2.4 (No Active Tenant Memberships)**:
  - **Given** an authenticated user has no active tenant memberships and no platform permissions
  - **When** the user arrives at the dashboard root
  - **Then** an actionable empty state is displayed
  - **And** the UI does not invent a default tenant or redirect to an unauthorized subdomain.

- **Scenario 2.5 (Platform Portal Entry)**:
  - **Given** a user has authorized platform permissions
  - **When** the user selects the platform portal
  - **Then** navigation moves to the `admin` subdomain
  - **And** the platform shell exposes only permitted platform destinations.

- **Scenario 2.6 (Avatar Menu Admin Entry)**:
  - **Given** the authenticated user's effective permissions include `PLATFORM:READ`
  - **When** the user opens the avatar menu from the workspace hub or a tenant workspace
  - **Then** the menu displays an “Admin” destination with a platform-security icon
  - **And** selecting it navigates to `toSubdomainUrl("admin", routes.admin.root)`
  - **And** the destination request performs fresh server-side authorization
  - **And** platform `admin` and `staff` users receive the item through their resolved permissions rather than a component-level role comparison.

- **Scenario 2.7 (Avatar Menu Without Platform Access)**:
  - **Given** the authenticated user's effective permissions do not include `PLATFORM:READ`
  - **When** the user opens the avatar menu
  - **Then** no Admin destination, separator, placeholder, or disabled platform item is rendered
  - **And** knowing or entering the admin URL does not bypass server-side authorization.

- **Scenario 2.8 (Admin Entry From Platform Context)**:
  - **Given** a platform-authorized user is already on the admin subdomain
  - **When** the avatar menu opens
  - **Then** the Admin item may link to the platform root and communicates the current destination through its active semantics
  - **And** the Workspaces item remains available as the route back to the dashboard workspace hub.

- **Scenario 2.9 (Future Create Store Entry)**:
  - **Given** the workspace hub reserves a first-class “Create store” action
  - **When** the separate tenant-onboarding feature is implemented
  - **Then** the action opens a lazily loaded, large drawer-based creation flow
  - **And** the flow collects store details and store-address availability, presents a review step, creates the tenant, and performs a fresh redirect to the new tenant subdomain
  - **And** it omits Nexudy's workspace-type selection because Hono Commerce currently has one tenant type
  - **And** this foundation MUST NOT ship a clickable non-functional creation control before that flow exists.

### User Story 3: Responsive Primary Navigation

> As a **merchant or platform operator**,  
> I want to **navigate effectively on desktop, tablet, and mobile**,  
> So that **the dashboard remains usable across operational environments**.

- **Scenario 3.1 (Expanded Desktop Sidebar)**:
  - **Given** the viewport supports the desktop sidebar
  - **When** the shell loads with the sidebar preference expanded
  - **Then** labels, groups, workspace identity, and account footer are visible
  - **And** the content frame fills the remaining width without horizontal overflow.

- **Scenario 3.2 (Icon-Collapsed Desktop Sidebar)**:
  - **Given** the sidebar is expanded
  - **When** the user activates the rail, header trigger, or `Cmd/Ctrl+B`
  - **Then** it collapses to icon mode
  - **And** every icon-only navigation action has an accessible tooltip and label
  - **And** the preference persists through the existing sidebar cookie.

- **Scenario 3.3 (Mobile Navigation)**:
  - **Given** the viewport is mobile-sized
  - **When** the user activates the sidebar trigger
  - **Then** the same navigation hierarchy opens in the sidebar's built-in mobile Sheet
  - **And** selecting a destination closes the Sheet
  - **And** touch targets are at least 44 by 44 CSS pixels
  - **And** focus is trapped while open and restored to the trigger after closing.

- **Scenario 3.4 (Active Nested Destination)**:
  - **Given** a user is viewing a nested route such as an order detail page
  - **When** the sidebar renders
  - **Then** the Orders destination is active
  - **And** the appropriate parent group is expanded
  - **And** route matching ignores query strings, hashes, and trailing slashes.

- **Scenario 3.5 (Shared Workspace Breadcrumbs)**:
  - **Given** an authenticated workspace page provides a breadcrumb trail
  - **When** the workspace header renders
  - **Then** one shared `WorkspaceBreadcrumbs` component displays the trail beside the sidebar trigger
  - **And** it composes the existing `@hono-commerce/ui/components/breadcrumb` primitives
  - **And** intermediate items are navigable links while the final item uses `aria-current="page"`
  - **And** individual pages do not recreate breadcrumb markup.

- **Scenario 3.6 (Dynamic Resource Breadcrumbs)**:
  - **Given** a user opens a dynamic resource route such as a product, order, or platform tenant detail
  - **When** its resource identity is resolved
  - **Then** the breadcrumb uses a meaningful authorized label such as the product name, order reference, or tenant name
  - **And** raw UUIDs, opaque route parameters, and unauthorized resource names are not exposed as labels
  - **And** a loading or unavailable label does not cause the header layout to jump.

- **Scenario 3.7 (Compact Breadcrumbs)**:
  - **Given** the breadcrumb trail is rendered in a narrow header
  - **When** all ancestors cannot fit without colliding with header actions
  - **Then** the current page remains visible
  - **And** ancestors are hidden or collapsed into an accessible overflow affordance
  - **And** long labels truncate visually while their full accessible text remains available
  - **And** the header does not horizontally scroll.

- **Scenario 3.8 (Breadcrumb Route Cleanup)**:
  - **Given** a page contributes a dynamic breadcrumb override
  - **When** navigation moves to another route
  - **Then** the old contribution is removed before it can describe the destination incorrectly
  - **And** the shell falls back to its route-aware breadcrumb configuration without flashing stale content.

### User Story 4: Permission-Aware Navigation

> As a **workspace member**,  
> I want to **see only the destinations available to me**,  
> So that **the interface reflects my effective authority without exposing misleading actions**.

- **Scenario 4.1 (Permission Granted)**:
  - **Given** `session.user.permissions` includes a navigation item's required permission
  - **When** navigation is resolved
  - **Then** that item is visible.

- **Scenario 4.2 (Permission Missing)**:
  - **Given** the required permission is absent
  - **When** navigation is resolved
  - **Then** the destination is omitted rather than rendered disabled
  - **And** direct requests remain protected by server-side authorization.

- **Scenario 4.3 (Empty Navigation Group)**:
  - **Given** all items in a navigation group are filtered out
  - **When** the sidebar renders
  - **Then** the empty group and its label are omitted.

- **Scenario 4.4 (Permissions Change)**:
  - **Given** the user's permissions have changed since the previous session
  - **When** a new authenticated session is established or revalidated
  - **Then** navigation is derived from the updated session permissions
  - **And** stale client-side navigation state does not grant access.

### User Story 5: Contextual Sidebar and Deep Work Surfaces

> As an **operator reviewing a product, order, conversation, or document**,  
> I want to **open supporting context without losing my place**,  
> So that **I can complete work efficiently**.

- **Scenario 5.1 (Desktop Contextual Sidebar)**:
  - **Given** a page contributes contextual sidebar content
  - **When** viewed on a large desktop viewport
  - **Then** the content appears in the existing responsive right rail
  - **And** the user may collapse and restore it
  - **And** the main page remains the primary scroll region unless the page explicitly opts into split scrolling.

- **Scenario 5.2 (Mobile Contextual Sidebar)**:
  - **Given** contextual content exists on a mobile viewport
  - **When** the user opens it
  - **Then** it appears in a titled, full-height Sheet
  - **And** it is not rendered as a permanently compressed second column.

- **Scenario 5.3 (Split View)**:
  - **Given** a supported page opens chat, document review, or a deep inspector
  - **When** the split view opens on desktop
  - **Then** the main content and secondary view render in resizable panels
  - **And** conflicting sidebar space is coordinated without overlapping content
  - **And** fullscreen and close actions are keyboard accessible.

- **Scenario 5.4 (Transactional Drawer)**:
  - **Given** a user begins a create or edit workflow
  - **When** the page invokes the shared drawer system
  - **Then** the drawer is rendered by the shell-level drawer host
  - **And** stacked drawers preserve ordering and focus behavior
  - **And** an unsaved workflow can require close confirmation.

- **Scenario 5.5 (Multi-Step Drawer Structure)**:
  - **Given** a create or configuration workflow contains multiple ordered steps
  - **When** it opens through the shared drawer host
  - **Then** a reusable multi-step flow renders an accessible title, current step label, “Step X of Y” status, segmented progress, one scrollable content region, and a fixed action footer
  - **And** Back, Next, final-submit, and Close actions remain in predictable positions
  - **And** the reusable flow contains no tenant, route, API, or domain-specific logic.

- **Scenario 5.6 (Step Validation and Navigation)**:
  - **Given** the current step contains invalid or incomplete required data
  - **When** the user activates Next or attempts to advance
  - **Then** only the current step is validated
  - **And** the user remains on that step
  - **And** focus moves to the first invalid field or the step-level error summary
  - **And** progress indicators do not permit skipping unvalidated future steps
  - **And** moving Back preserves entered values without requiring the current step to validate.

- **Scenario 5.7 (Submission Lifecycle)**:
  - **Given** all required steps are valid
  - **When** the user performs the final submit action
  - **Then** duplicate navigation and submissions are disabled while pending
  - **And** a stable pending label and Spinner are presented without moving the footer
  - **And** a recoverable server error remains inside the final step with retry guidance and preserved values
  - **And** success closes or replaces the workflow only according to the owning feature's explicit success policy.

- **Scenario 5.8 (Responsive Multi-Step Drawer)**:
  - **Given** the multi-step flow opens on a desktop viewport
  - **When** the drawer is rendered
  - **Then** it opens from the right at a useful large preset and may use the existing horizontal resize capability
  - **And** the background remains visually contextual but inert while the drawer has modal focus
  - **And** header and footer stay fixed while only the step body scrolls
  - **And** on mobile the same flow becomes a full-height, full-width Sheet with safe-area-aware actions and at least 44 by 44 CSS pixel touch targets.

- **Scenario 5.9 (Close Protection and Recovery)**:
  - **Given** a multi-step workflow contains changes that have not been submitted
  - **When** the user presses Escape, activates Close, clicks the backdrop, or navigates away
  - **Then** the workflow applies its explicit close policy
  - **And** destructive dismissal requires confirmation
  - **And** cancelling dismissal returns focus to the workflow without losing data
  - **And** confirmed dismissal clears sensitive in-memory values and restores focus to the original trigger.

- **Scenario 5.10 (Route Change Cleanup)**:
  - **Given** a route-owned drawer, modal, split view, or contextual override is open
  - **When** navigation moves to an unrelated route
  - **Then** route-owned secondary UI closes or resets according to its ownership policy
  - **And** stale content is not displayed on the destination page.

### User Story 6: Structural Workspace Home

> As a **merchant operator**,  
> I want to **enter a stable, clearly identified store workspace**,
> So that **I can navigate the management application while domain dashboards are developed independently**.

- **Scenario 6.1 (Shell-Proving Landing Surface)**:
  - **Given** an authorized user opens a tenant root
  - **When** the workspace shell loads
  - **Then** the page identifies the active store and provides access to implemented destinations
  - **And** it validates the main content frame, header, breadcrumbs, responsive behavior, and optional page-action boundary
  - **And** it does not request or render aggregate commerce metrics.

- **Scenario 6.2 (No Fabricated Operational Data)**:
  - **Given** Orders, Catalog, Inventory, or Analytics aggregates are unavailable or outside this feature
  - **When** the tenant root renders
  - **Then** the interface does not display invented revenue, order, stock, conversion, or activity values
  - **And** it does not use demo records that could be mistaken for tenant production data.

- **Scenario 6.3 (Independent Future Overview)**:
  - **Given** a future merchant-overview feature is specified
  - **When** it replaces or extends the structural workspace home
  - **Then** its API contracts, aggregates, loading states, errors, and business acceptance criteria are defined in that feature
  - **And** the workspace shell remains reusable without depending on those contracts.

- **Scenario 6.4 (Landing Surface Lifecycle)**:
  - **Given** the tenant workspace bootstrap is loading, empty, unavailable, or failed
  - **When** the tenant root renders
  - **Then** the landing surface uses the shell lifecycle state for that condition
  - **And** it does not introduce a second domain-data loading state.

### User Story 7: Passwordless Sign-In and Shell Handoff

> As a **dashboard user**,  
> I want to **request a magic link and enter the correct workspace after verification**,  
> So that **authentication is secure and the transition into the dashboard is predictable**.

- **Scenario 7.1 (Initial Sign-In)**:
  - **Given** the visitor is signed out
  - **When** the sign-in page loads
  - **Then** the email-first magic-link form is visible
  - **And** the form uses the shared Zod input schema, React Hook Form, `FieldGroup`, `Field`, and Base UI controls
  - **And** desktop uses a restrained two-column layout with a static commerce visual and no carousel
  - **And** the form remains the dominant interactive element
  - **And** mobile omits the non-essential visual column rather than compressing both columns.

- **Scenario 7.2 (Magic-Link Request Pending)**:
  - **Given** a syntactically valid email was submitted
  - **When** the request is pending
  - **Then** the submit action is disabled
  - **And** a Spinner and stable pending label are shown
  - **And** duplicate submissions are prevented.

- **Scenario 7.3 (Magic-Link Request Success)**:
  - **Given** the request completes without a public error
  - **When** the response is handled
  - **Then** the page shows the same check-your-email confirmation regardless of whether an account previously existed
  - **And** account existence is not disclosed
  - **And** resend behavior is rate-limited and communicates its cooldown.

- **Scenario 7.4 (Safe Callback)**:
  - **Given** a `callbackUrl` query value is present
  - **When** the sign-in or verification flow evaluates it
  - **Then** only relative dashboard paths or allowed dashboard tenant/admin origins under the configured root domain are accepted
  - **And** invalid or external callback targets fall back to the dashboard root
  - **And** the raw query value is never forwarded without validation.

- **Scenario 7.5 (Authenticated User Visits Sign-In)**:
  - **Given** an active authenticated session exists
  - **When** the user visits sign-in without a recoverable auth error
  - **Then** the user is redirected to a validated callback when one is present and safe
  - **And** otherwise the user is redirected to the workspace hub.

- **Scenario 7.6 (Expired or Invalid Verification)**:
  - **Given** the magic-link token is expired, invalid, or already used
  - **When** verification fails
  - **Then** the page shows the expired/error state without exposing token details
  - **And** provides an action to request a new link.

### User Story 8: Workspace Manager Header and Personal Controls

> As an **authenticated dashboard user**,
> I want **workspace-level navigation, notifications, account actions, and appearance preferences in a stable header**,
> So that **I can manage my account context without entering a tenant first**.

- **Scenario 8.1 (Workspace Hub Header Composition)**:
  - **Given** an authenticated user is viewing the dashboard base URL
  - **When** the workspace hub header renders
  - **Then** the left side displays `Workspace Manager` through the shared workspace breadcrumb/header system
  - **And** no tenant-sidebar trigger is rendered because the hub is outside a tenant or platform shell
  - **And** the right side displays, in order, the notification bell, account avatar, and appearance palette controls
  - **And** no search, command, messaging, or AI control is rendered on the workspace hub
  - **And** the header remains visually stable while its interactive data loads.

- **Scenario 8.2 (Shared Breadcrumb Contract)**:
  - **Given** the workspace hub, a tenant page, or a platform page supplies header context
  - **When** its header renders
  - **Then** the same domain-neutral `WorkspaceBreadcrumbs` renderer is used
  - **And** the workspace hub supplies a single current-page item named `Workspace Manager`
  - **And** tenant and platform pages may supply authorized ancestor links and dynamic labels
  - **And** individual pages do not reproduce breadcrumb markup.

- **Scenario 8.3 (Notification Summary)**:
  - **Given** the authenticated user opens the notification bell
  - **When** recent notifications are available
  - **Then** an accessible popover on desktop or Sheet on constrained mobile displays the latest user-scoped notifications in reverse chronological order
  - **And** unread notifications are distinguishable through text or semantics in addition to color
  - **And** activating a safe internal notification action marks that notification as read and navigates to its authorized destination
  - **And** opening the surface alone does not silently mark every notification as read.

- **Scenario 8.4 (Notification Empty, Loading, and Error States)**:
  - **Given** the notification request is pending, empty, or failed
  - **When** the notification surface opens
  - **Then** it renders a layout-stable Skeleton, a `No notifications` empty state, or an inline retry state respectively
  - **And** a failed notification request does not break the header or account controls
  - **And** no `View all notifications` link is shown until a real notification-inbox page is registered in the frontend route catalog.

- **Scenario 8.5 (Unread Refresh)**:
  - **Given** the authenticated dashboard remains open
  - **When** 30 seconds elapse while the document is active, or the window regains focus
  - **Then** TanStack Query refreshes the user-scoped notification summary
  - **And** the bell exposes the unread count with an accessible label
  - **And** no persistent WebSocket connection is created solely for the notification bell.

- **Scenario 8.6 (Account Menu)**:
  - **Given** the user activates the header avatar
  - **When** the account menu opens
  - **Then** it displays the user's avatar fallback, name, and email
  - **And** provides the Workspaces destination and Sign Out action
  - **And** provides the Admin destination only through the `PLATFORM:READ` permission contract defined in Scenarios 2.6–2.8.

- **Scenario 8.7 (Appearance Panel)**:
  - **Given** the user activates the appearance palette
  - **When** the right-side appearance panel opens
  - **Then** the user can choose only Light or Dark color mode
  - **And** Electric Indigo remains the fixed Hono Commerce brand accent in every mode
  - **And** semantic success, warning, destructive, and informational colors retain their defined meanings
  - **And** the selected Light or Dark mode persists across reloads and authenticated dashboard origins without a hydration flash
  - **And** no System choice or Reset-to-System action is rendered.

- **Scenario 8.8 (First-Visit Device Default)**:
  - **Given** the user has never selected Light or Dark and has no valid saved mode
  - **When** the dashboard first loads
  - **Then** the initial theme follows the device's current `prefers-color-scheme` value
  - **And** the resolved Light or Dark choice is reflected accurately in the appearance control
  - **And** the device-derived default is not presented as a third selectable System mode
  - **And** after the user explicitly chooses Light or Dark, that persisted choice takes precedence over later device-scheme changes.

- **Scenario 8.9 (Responsive Header Actions)**:
  - **Given** the viewport is narrow or content is zoomed
  - **When** the workspace hub header reflows
  - **Then** `Workspace Manager` remains identifiable without colliding with the action cluster
  - **And** the bell, avatar, and appearance controls remain at least 44 by 44 CSS pixels
  - **And** their popover, menu, and Sheet surfaces trap or manage focus appropriately and restore focus to their triggers on close.

---

## 7. Workspace Bootstrap Contract

### 7.1 User Workspace Collection

The feature requires an authenticated Hono RPC endpoint under the personal user scope:

`GET /api/v1/users/me/workspaces`

The endpoint MUST:

- Require an active authenticated session.
- Return only tenants associated with the authenticated user.
- Include enough information to render and authorize the workspace selector: tenant ID, name, slug, stored logo key or safe resolved display asset, tenant status, membership role, membership status, and effective permissions.
- Represent platform portal eligibility separately from tenant membership entries.
- Use the standardized success envelope.
- Never accept a user ID from a query, path, or request body.
- Never expose another user's memberships.
- Use Hono route inference for the response type. No redundant response DTO may be added to `packages/types`.

If an equivalent typed endpoint already exists by implementation time, the plan MAY reuse it rather than introduce a duplicate, provided every behavioral requirement above is satisfied.

### 7.2 Active Workspace Resolution

- The dashboard base URL MUST render the workspace hub for every authenticated user unless a validated callback explicitly targets an authorized destination.
- The base URL MUST NOT automatically redirect merely because the user has exactly one authorized destination.
- The verified tenant hostname/subdomain MUST be the authoritative active tenant for merchant routes.
- The `admin` hostname MUST be the authoritative platform context.
- Client-provided `x-tenant-slug` headers MUST remain untrusted and stripped by `proxy.ts`.
- The application MUST NOT choose the first workspace as an implicit active workspace when a hostname context exists.
- The UI MUST NOT drill `tenantId` or `slug` through multiple component layers. Server components use verified request context; client components use a workspace context provider.
- Switching workspaces MUST perform cross-origin/subdomain navigation using the centralized route utilities and MUST trigger fresh server authorization.

### 7.3 Personal Notification Summary

The workspace-manager header requires the unfinished personal notification contract from specification `002`:

- `GET /api/v1/users/me/notifications` returns the authenticated user's recent notifications and unread count using the standardized success envelope.
- `PATCH /api/v1/users/me/notifications/:notificationId` accepts one shared request schema for the supported read-state transition and returns the updated resource through the standardized success envelope.
- Both operations derive `userId` exclusively from the authenticated session; they MUST NOT accept or trust a user ID from params, query, or body input.
- Listing and mutation queries MUST filter by `notification.userId = session.user.id`. A tenant association may further scope presentation, but it MUST NOT broaden personal access.
- The list defaults to a small header-appropriate page and sorts newest first. Pagination inputs, if exposed, MUST use the shared bounded pagination utilities.
- Notification action URLs MUST be relative dashboard routes or validated dashboard tenant/admin origins. Foreign, malformed, protocol-relative, JavaScript, or unauthorized tenant destinations MUST be rendered without navigation.
- Frontend payload types MUST be inferred from Hono RPC. No manual response DTO or backend route dictionary may be introduced.
- The client query key MUST include authenticated-user scope, poll every 30 seconds while appropriate, and refresh when the window regains focus as required by specification `002`.

This feature does not require a database schema or migration change: the existing persistent `notification` table remains the source of truth.

### 7.4 Appearance Preference Contract

- Color mode is a personal presentation preference, not tenant configuration.
- The selectable and persistable preference contract supports only `light | dark`.
- When no valid explicit preference exists, the pre-hydration bootstrap MUST resolve the initial Light or Dark theme from `prefers-color-scheme` without exposing `system` as a selectable value.
- A valid saved Light or Dark preference MUST take precedence over the device scheme and be resolved before interactive hydration where practical so the first painted mode matches the eventual client state.
- Invalid or obsolete persisted values MUST be cleared and treated as no explicit preference, causing the initial theme to resolve from the current device scheme.
- Electric Indigo remains the fixed `primary`, focus-ring, chart-primary, and sidebar-primary brand family in light and dark mode. Status colors retain their established semantic meanings.
- The Appearance panel MUST NOT expose a System option, reset-to-system action, raw color input, or alternative accent choices in this feature.
- Preference persistence MUST work across the dashboard root, tenant subdomains, and admin subdomain under the configured dashboard domain. The implementation plan will choose a secure shared-domain cookie or an equivalent existing server-readable preference mechanism.
- No new environment variable is introduced unless it is registered in `@hono-commerce/env` and the applicable `.env.example` files.

---

## 8. UI Lifecycle State Matrix

Every shell-level interactive surface MUST explicitly handle the following states without layout instability:

| State              | Authenticated Shell                                                                       | Workspace Hub                                                                                                          | Sign-In                                                               | Structural Tenant Home                           |
| :----------------- | :---------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :----------------------------------------------- |
| Initial            | Server-resolved frame is ready for content                                                | Stable hub frame is ready                                                                                              | Email form is available                                               | Shell-owned tenant identity is ready             |
| Loading            | Layout-matched sidebar, header, and content Skeletons                                     | Card/list Skeletons reserve the destination layout                                                                     | Submit button shows Spinner and stable label                          | Uses workspace-bootstrap Skeletons only          |
| Success            | Authorized shell and current workspace identity render                                    | Authorized tenant and platform destinations render                                                                     | Check-inbox confirmation and resend guidance render                   | Store identity and implemented navigation render |
| Empty              | No-workspace state provides a valid next action                                           | No-destination state explains that no store access exists and reserves the future creation path                        | Not normally applicable; form remains initial                         | No separate domain empty state is introduced     |
| Error              | Local retry for recoverable bootstrap failures; fatal boundary for unrecoverable failures | Collection failure remains within the hub frame and provides retry                                                     | Inline request error and retry remain in context                      | Uses the owning workspace error boundary         |
| Disabled / Expired | Suspended account, membership, or tenant state explains why access is unavailable         | Suspended or unavailable destinations communicate status and cannot be opened; non-functional creation UI is not shown | Rate-limit cooldown or expired-link recovery is distinct from loading | Uses the tenant or membership unavailable state  |

### 8.1 Multi-Step Drawer State Matrix

| State              | Required Behavior                                                                                                                                        |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial            | The first allowed step renders with pristine values, accurate progress, enabled Close, and valid Back/Next availability.                                 |
| Loading            | Async step setup uses a layout-matched Skeleton; final submission uses a stable button label and Spinner while navigation and duplicate submit disable.  |
| Success            | The owning feature displays confirmation or performs its declared close/redirect policy exactly once.                                                    |
| Empty              | A flow configured with no available steps renders a controlled configuration-empty state and cannot submit.                                              |
| Error              | Field errors remain beside fields; step or server errors remain within the owning step with recovery actions and preserved non-sensitive values.         |
| Disabled / Expired | Permission loss, expired intent, or unavailable target disables progression, explains why, and offers the owning feature's safe exit or recovery action. |

### 8.2 Header Control State Matrix

| State              | Notification Center                                                                                                                    | Appearance Panel                                                                                 | Account Menu                                                                                    |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| Initial            | Bell is operable with a stable accessible label; no unread count is invented                                                           | Saved Light/Dark mode or the first-visit device-derived mode is already reflected                | Session identity and allowed destinations are ready                                             |
| Loading            | Bell remains stable; opened surface uses notification-row Skeletons                                                                    | Controls remain disabled only while a real persistence transition is pending                     | Avatar-sized Skeleton is used only when session identity is genuinely unresolved                |
| Success            | Recent items and accurate unread count render; safe item actions may navigate and update read state                                    | Selected mode applies through semantic tokens and persists; the brand accent remains unchanged   | Identity, Workspaces, conditional Admin, and Sign Out actions render                            |
| Empty              | `No notifications` empty state renders without a fake item or dead `View all` link                                                     | Not applicable; valid defaults are always available                                              | Optional menu groups that have no authorized entries are omitted                                |
| Error              | Inline retry appears inside the surface; the header and other actions remain usable                                                    | Last valid preference remains applied and a local recovery message is shown if persistence fails | Sign-out or navigation failure remains contextual and does not expose unauthorized destinations |
| Disabled / Expired | Signed-out or expired sessions remove protected data and follow the authenticated-shell recovery path; unsafe action URLs are disabled | Invalid persisted values are cleared and the device-derived Light/Dark default is used           | Session expiry closes the menu and follows the authenticated-shell recovery path                |

---

## 9. Responsive Behavior Requirements

| Viewport / Capability    | Required Behavior                                                                                                                                                                                                                         |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile                   | Primary navigation uses the sidebar's mobile Sheet; contextual sidebar and appearance use separate titled Sheets; the notification summary may use a Sheet; non-essential auth artwork is omitted; header touch targets are at least 44px |
| Tablet / compact desktop | Primary sidebar supports icon collapse; labels remain available through tooltips; the title/breadcrumb compacts before the notification, account, or appearance actions are removed                                                       |
| Large desktop            | Expanded or icon-collapsed primary sidebar; optional contextual right rail; split-view support without overlay collisions                                                                                                                 |
| Multi-step drawer        | Large, optionally resizable right drawer on desktop; full-screen Sheet with safe-area-aware fixed actions and a scrollable body on mobile                                                                                                 |
| Reduced motion           | Non-essential transitions and animated decoration are disabled or reduced according to `prefers-reduced-motion`                                                                                                                           |
| Zoom / reflow            | Content remains usable at 200% zoom without clipped navigation or inaccessible actions                                                                                                                                                    |

The normal workspace shell MUST use a bounded viewport frame (`dvh`-aware), `min-h-0` flex boundaries, and one intentional main page-scroll owner. Persistent shell regions MUST NOT create nested whole-page scrollbars.

---

## 10. Component and Ownership Boundaries

### 10.1 `packages/ui`

Reusable composite shell systems belong under `packages/ui/src/shared/workspace-shell/*` or the appropriate existing `shared/*` domain. They MAY include:

- Generic workspace shell composition.
- Data-driven sidebar renderer and navigation types.
- Workspace header and breadcrumb presentation.
- A domain-neutral `WorkspaceBreadcrumbs` renderer with accessible links, current-page semantics, truncation, and compact overflow behavior.
- A slot-based `WorkspaceHeaderActions` composition that renders only supplied controls and does not inject search, command, messaging, or AI actions by default.
- Domain-neutral notification-center presentation under `packages/ui/src/shared/notifications/*`, including trigger, unread badge semantics, list, Skeleton, empty, and error presentations without owning data fetching or routes.
- A reusable appearance panel under `packages/ui/src/shared/appearance/*`, composed from existing Base UI controls and semantic theme tokens.
- User footer and avatar-menu presentation, accepting already-authorized navigation items rather than evaluating application roles.
- Shell Skeleton and generic failure-state presentation.
- Composition with the existing responsive content sidebar, split view, drawer, and modal systems.
- A domain-neutral `MultiStepFlow` system under `packages/ui/src/shared/forms/multi-step-flow/*`, composed inside the existing `GlobalDrawer` rather than coupled to it.
- Drawer close-guard and ownership contracts required for unsaved multi-step workflows.

They MUST NOT import dashboard route catalogs, Better Auth clients, Hono clients, or tenant/platform business logic.

`MultiStepFlow` owns step registration, current-step state, progress semantics, guarded forward navigation, backward navigation, scroll regions, and shared actions. It MUST accept precisely typed callbacks and renderable content without owning React Hook Form instances, Zod schemas, API mutations, tenant context, success redirects, or feature copy.

Atomic sidebar, Sheet, Button, Breadcrumb, Tooltip, Skeleton, Avatar, Dropdown Menu, and related primitives remain under `packages/ui/src/components/*`.

### 10.2 `apps/dashboard`

Application-specific adapters belong in `apps/dashboard` and own:

- Session and workspace bootstrap.
- Tenant and platform navigation configuration.
- Avatar-menu destination configuration and permission filtering.
- Workspace-manager header composition and action ordering.
- Mapping real page routes to navigation items and breadcrumbs.
- Route-aware breadcrumb resolution and page-level dynamic label contributions for authorized resources.
- Permission filtering input.
- Hono RPC queries and TanStack Query behavior.
- Personal notification queries, read-state mutations, safe action routing, polling, and cache invalidation.
- Server-readable appearance preference resolution and persistence across dashboard subdomains.
- Tenant and platform shell layouts.
- Sign-in and verification route behavior.
- Workspace hub composition and structural tenant-home composition.
- The reserved integration boundary for a future store-creation drawer.
- Concrete multi-step definitions, React Hook Form state, per-step Zod validation, mutation behavior, success policy, and route/navigation effects for application workflows.

The tenant and platform layouts MUST use the same generic shell renderer and MUST NOT duplicate sidebar markup.

### 10.3 `packages/types`

- Frontend page routes remain in `packages/types/src/routes/catalog.ts`.
- Backend API endpoints MUST NOT be added to the page route catalog.
- The notification read-state request input schema is authored once and reused by backend and frontend.
- Response payload types are inferred from the Hono RPC endpoint under ADR-005.

### 10.4 `apps/api`

- Personal notification handlers live as one operation per file under the existing user/notification vertical slice and are mounted declaratively beneath `/api/v1/users/me/notifications`.
- Handlers use `createFactory().createHandlers(...)`, shared validation, the existing response helpers, and session-derived personal scope.
- Listing, unread-count calculation, and read-state mutation query the existing notification schema; this feature does not create or modify migration files.

---

## 11. Invariants & Platform Guardrails (RFC 2119)

1. **`MUST`** use the existing `@hono-commerce/ui/components/sidebar` primitive and `SidebarProvider`; the feature MUST NOT implement another responsive sidebar state machine.
2. **`MUST`** use Base UI `render` composition for custom triggers and links; it MUST NOT use Radix `asChild`.
3. **`MUST`** place composite shell components under `packages/ui/src/shared/*`, not `packages/ui/src/components/*`.
4. **`MUST`** keep route-, session-, API-, and permission-specific adapters inside `apps/dashboard`.
5. **`MUST`** derive navigation visibility from effective session permissions, not hardcoded role comparisons.
6. **`MUST`** re-authorize every protected API operation server-side; hidden UI is not authorization.
7. **`MUST`** resolve merchant context from the verified hostname or server request context.
8. **`MUST NOT`** accept or trust a client-supplied tenant header.
9. **`MUST NOT`** drill `tenantId`, `slug`, role, or permission arrays through multiple presentational component levels.
10. **`MUST`** use the centralized frontend page route catalog for navigation.
11. **`MUST NOT`** create a manual backend API route dictionary.
12. **`MUST`** infer new frontend API response types from Hono RPC via `InferResponseType`.
13. **`MUST NOT`** introduce manual response DTOs in `@hono-commerce/types`.
14. **`MUST`** use semantic Tailwind tokens from the shared design system; arbitrary hex colors and inline visual overrides are forbidden.
15. **`MUST`** implement the six lifecycle states defined by this specification for shell bootstrap, workspace-hub content, tenant-home content, and sign-in interactions.
16. **`MUST`** use `Skeleton` for layout-stable loading states and shared `Empty`/`EmptyState` components for zero-data states.
17. **`MUST`** use `FieldGroup`, `Field`, visible labels, and shared validation schemas for sign-in forms.
    17a. **`MUST`** use shared shadcn/Base UI controls, React Hook Form, and Zod schemas for every form; server-backed submissions **MUST** use typed TanStack Query mutations and invalidation. Raw HTML controls and ad-hoc request payloads are forbidden where shared primitives exist.
18. **`MUST`** use `StatusPill` or established Badge variants for operational status; bespoke styled status spans are forbidden.
19. **`MUST`** render `AvatarFallback` whenever an Avatar is used.
20. **`MUST`** give every icon-only action an accessible name and visible focus treatment.
21. **`MUST`** preserve at least 44px touch targets on mobile.
22. **`MUST`** respect reduced-motion preferences.
23. **`MUST`** keep the main navigation hierarchy equivalent across desktop and mobile; separate divergent mobile navigation markup is forbidden.
24. **`MUST`** ensure overlays and secondary surfaces include accessible titles, focus management, Escape handling, and focus restoration.
25. **`MUST`** mount split view around authenticated page content rather than as a detached root overlay.
26. **`MUST`** mount dashboard-only drawer and modal hosts inside the authenticated workspace boundary, not across public auth pages.
27. **`MUST`** close or reset route-owned secondary surfaces when their owning route is left.
28. **`MUST NOT`** add navigation destinations without real routes and established permissions.
29. **`MUST NOT`** store private tenant logos or documents as permanent public URLs; private assets use stored S3 keys and signed preview URLs.
30. **`MUST NOT`** use `any`, `unknown`, type assertions, or routing casts as escape hatches.
31. **`MUST NOT`** create, edit, delete, generate, or run database migrations for this feature.
32. **`MUST`** run `bun run verify` with zero warnings and zero errors before implementation is considered complete.
33. **`MUST NOT`** run `bun run build` as routine verification.
34. **`MUST NOT`** fabricate merchant metrics, activity, operational alerts, or aggregate data to decorate the structural tenant home.
35. **`MUST NOT`** render an enabled “Create store” control until the separate tenant-onboarding flow has a real route or drawer action, validation contract, authorization policy, and mutation implementation.
36. **`MUST`** preserve a clear workspace-hub placement and composition boundary for that future “Create store” action.
37. **`MUST`** implement multi-step workflow composition as a shared domain-neutral system under `packages/ui/src/shared/forms/*`, not as application logic inside the atomic Sheet or Drawer primitives.
38. **`MUST`** keep the existing `GlobalDrawer` as the single authenticated drawer host and use its `naked` composition mode for workflows that supply the multi-step header, body, and footer.
39. **`MUST`** validate the current step before forward navigation and final submission; future steps MUST NOT be reachable by bypassing required validation.
40. **`MUST`** preserve form values during backward navigation and recoverable submission failures while clearing sensitive values after confirmed dismissal.
41. **`MUST`** expose progress with semantic text in addition to visual segments; color or animation alone MUST NOT communicate step state.
42. **`MUST`** maintain one scrollable step-body region with non-scrolling header and footer actions, including mobile safe-area padding.
43. **`MUST`** disable duplicate Next and Submit actions while their validation or mutation is pending.
44. **`MUST`** support an explicit async close guard so Escape, backdrop dismissal, Close, and route changes cannot silently discard dirty workflows.
45. **`MUST NOT`** copy Nexudy's Radix `asChild`, raw button, permissive future-step navigation, loose record payloads, or domain-specific multi-step implementation into this Base UI architecture.
46. **`MUST`** expose the avatar-menu Admin destination only when `hasPermission(authContext, "PLATFORM:READ")` succeeds.
47. **`MUST NOT`** determine avatar-menu Admin visibility with inline `role === "admin"` or `role === "staff"` checks.
48. **`MUST`** generate the Admin destination with the centralized route and subdomain utilities and re-authorize access at the destination.
49. **`MUST`** render authenticated breadcrumbs through one shared shell component composed from the existing Base UI breadcrumb primitives.
50. **`MUST`** keep route catalogs, pathname interpretation, and domain-resource label resolution in `apps/dashboard`; the shared renderer MUST remain route- and domain-agnostic.
51. **`MUST`** remove route-owned dynamic breadcrumb contributions when their route unmounts or changes.
52. **`MUST NOT`** display raw IDs, unauthorized resource names, or inaccessible parent links in breadcrumbs.
53. **`MUST`** keep the current page visible in compact layouts and prevent breadcrumbs from displacing essential header actions.
54. **`MUST`** render the workspace hub header with `Workspace Manager` on the left and notification, account, and appearance controls on the right.
55. **`MUST NOT`** render a search or command trigger on the workspace hub; shared header actions MUST be explicit slots rather than controls injected by default.
56. **`MUST`** back notification items and unread counts with the authenticated personal notification API; fabricated header notifications are forbidden.
57. **`MUST`** scope every notification list and mutation query to the session user and validate every notification action destination before navigation.
58. **`MUST`** use 30-second smart HTTP polling plus focus refresh for the notification summary and **`MUST NOT`** open a WebSocket solely for the bell.
59. **`MUST NOT`** mark all notifications read merely because the notification surface opened.
60. **`MUST NOT`** render a dead `View all notifications` link before a real inbox route is registered and implemented.
61. **`MUST`** keep Electric Indigo as the fixed brand accent and preserve established semantic status colors; raw color input, alternative accent selection, and per-component color overrides are forbidden in this feature.
62. **`MUST`** persist and validate an explicit Light or Dark preference across the dashboard root, tenant, and admin origins without a visible hydration flash; when no valid preference exists, the initial resolved theme MUST follow the device scheme without rendering System as an option.
63. **`MUST`** preserve notification, account, and appearance actions as essential controls when header space is constrained; breadcrumbs compact before these actions disappear.

---

## 12. Security & Permissions

### Authentication Boundary

- All tenant and platform layouts require an active Better Auth session.
- Session validation occurs before protected content renders.
- Suspended, deactivated, or banned users cannot access the authenticated shell.
- Auth redirects preserve only validated dashboard callback destinations.
- Auth UI must not disclose whether an email address already has an account.

### Tenant Isolation

- The active tenant slug comes from the verified proxy/hostname path.
- Workspace collection queries filter by the authenticated user ID obtained from the session.
- Tenant-scoped API queries filter by the authorized tenant ID.
- Switching tenants causes a new request and fresh authorization for the destination tenant.
- A cached workspace response from one tenant must never populate another tenant's shell.

### Personal Notification Isolation

- Notification identity is resolved from the active session; clients cannot select another user.
- List, unread-count, and read-state operations filter by the authenticated user before returning or mutating a row.
- A notification's optional tenant association does not grant membership or authorize its action URL.
- Tenant-linked actions are re-authorized by the destination route and never expose inaccessible tenant names or resources through the header.
- Notification query caches are cleared or identity-scoped when the session changes or the user signs out.

### Permission Boundary

- Platform and tenant navigation use explicit permission metadata.
- Moderation, queue observability, and platform settings use `MODERATION:READ`, `QUEUES:READ`, and `PLATFORM:SETTINGS`, respectively; they MUST be registered in the canonical permission system and session resolution before the matching navigation ships.
- The avatar-menu Admin entry uses the existing `PLATFORM:READ` permission. The platform `admin` role satisfies it through wildcard access and `staff` receives it through the canonical role-permission registry; UI components do not inspect those role names.
- Permission checks use the shared `hasPermission(authContext, permission)` contract on the server and the established permission-gating contract on the client.
- The session remains the source of effective permission keys for navigation rendering.
- No component uses an inline `user.role === ...` authorization branch.

### Callback and Cross-Subdomain Safety

- Callback validation permits only relative dashboard paths and configured dashboard tenant/admin origins.
- Protocol-relative URLs, foreign origins, malformed URLs, JavaScript URLs, and unsupported schemes are rejected.
- Cross-subdomain workspace links are generated by `toSubdomainUrl` using the validated route catalog.

---

## 13. Accessibility Requirements

1. Navigation, tenant switching, user menus, contextual sidebars, drawers, and modals MUST be operable by keyboard alone.
2. The current page MUST be communicated through the sidebar's active state and appropriate ARIA semantics.
3. Icon-only collapsed navigation MUST expose accessible labels and tooltips.
4. Sidebar, contextual Sheet, drawer, and modal focus MUST be trapped while appropriate and restored on close.
5. Breadcrumbs MUST expose the current page and avoid horizontally overflowing narrow headers.
6. Color MUST NOT be the only way to communicate status, selection, or error.
7. Text and interactive controls MUST meet WCAG AA contrast requirements in light and dark themes.
8. Mobile controls MUST meet the 44px minimum touch-target requirement.
9. Loading announcements MUST be understandable without repeatedly interrupting assistive technology.
10. Error states MUST place recovery actions adjacent to the failure description.
11. The notification bell MUST expose an accessible name and unread count without relying on badge color alone.
12. Appearance choices MUST expose selected state programmatically and retain WCAG AA contrast in every supported color mode.
13. The workspace-manager action order MUST remain logical and consistent for keyboard and screen-reader navigation: notifications, account, then appearance.

---

## 14. Performance & UX Requirements

- The shell MUST avoid a flash of unauthorized navigation.
- Sidebar open state SHOULD be resolved from the existing cookie on the server where practical to minimize hydration movement.
- Desktop auth imagery MUST be static, MUST NOT use a carousel, MUST NOT block the form, and SHOULD NOT be loaded on mobile when it is not rendered.
- Shell data SHOULD be fetched once per relevant authenticated boundary and shared through context or query cache.
- Changing client-side pages inside the same workspace SHOULD preserve the shell, sidebar preference, and stable providers.
- TanStack Query keys MUST include the identity or scope needed to prevent cross-user or cross-tenant cache reuse.
- Notification polling MUST pause or avoid unnecessary work when the document is not active where supported, while focus refresh restores freshness immediately.
- A saved Light/Dark mode SHOULD be applied from a server-readable value before hydration; when none exists, a pre-hydration device-scheme bootstrap SHOULD prevent a light/dark flash.
- Page transitions SHOULD preserve the header and primary navigation while displaying layout-matched content Skeletons.
- The structural tenant home MUST NOT initiate aggregate overview requests; domain dashboard performance is deferred to its own specification.

---

## 15. Edge Cases & Failure Modes

| Edge Case                                           | Expected System Behavior                                                                          | HTTP Status / Error Code                           |
| :-------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :------------------------------------------------- |
| No authenticated session                            | Redirect to sign-in with validated callback                                                       | `401 UNAUTHORIZED` where returned by API           |
| User account suspended, deactivated, or banned      | Show account unavailable state; no protected shell                                                | `403 FORBIDDEN` / established auth error code      |
| Tenant slug does not exist                          | Show tenant-not-found state without workspace data                                                | `404 NOT_FOUND`                                    |
| User is not a tenant member                         | Show access-denied state; omit tenant navigation                                                  | `403 FORBIDDEN`                                    |
| Membership suspended                                | Show membership-suspended state                                                                   | `403 FORBIDDEN`                                    |
| Tenant suspended                                    | Show tenant-suspended state with no mutations                                                     | `403 FORBIDDEN` / `TENANT_SUSPENDED`               |
| Tenant under maintenance                            | Show maintenance state and recovery guidance                                                      | `503 SERVICE_UNAVAILABLE` / `TENANT_MAINTENANCE`   |
| Workspace collection is empty                       | Show no-workspace empty state                                                                     | `200 OK` with empty data collection                |
| Workspace bootstrap network failure                 | Preserve shell-sized error boundary and provide retry                                             | Network/client failure                             |
| Workspace entry becomes stale                       | Destination authorization rejects access and workspace list revalidates                           | `403` or `404` as appropriate                      |
| Invalid external callback URL                       | Discard callback and use dashboard root                                                           | No public error required                           |
| Magic-link request rate limited                     | Preserve form data, disable resend until allowed, explain cooldown                                | `429 TOO_MANY_REQUESTS`                            |
| Magic-link token expired or used                    | Show expired state and request-new-link action                                                    | Auth provider failure mapped to expired/invalid UI |
| Sidebar cookie malformed                            | Use safe default without breaking render                                                          | Not applicable                                     |
| Current nested route is not in navigation           | Render page and breadcrumbs safely without falsely activating another item                        | Not applicable                                     |
| Dynamic breadcrumb label is pending                 | Reserve stable header space and use a non-sensitive loading label until authorized data resolves  | Owning resource request                            |
| Dynamic breadcrumb resource is denied or missing    | Do not expose its name; render the owning access-denied or not-found state                        | `403 FORBIDDEN` or `404 NOT_FOUND`                 |
| All items in a group lack permission                | Omit the group                                                                                    | Not applicable                                     |
| Platform permission is absent from avatar-menu user | Omit Admin and any now-empty separator; direct admin navigation remains denied                    | `403 FORBIDDEN` at the protected destination       |
| Platform permission changes during a session        | Revalidated session/menu reflects the new state; destination authorization remains final          | `403 FORBIDDEN` if stale access is attempted       |
| Contextual sidebar content is removed               | Remove its trigger and reclaim main-content width                                                 | Not applicable                                     |
| Split view requested on constrained mobile viewport | Use an accessible full-screen secondary surface rather than unusable side-by-side panels          | Not applicable                                     |
| Drawer route changes during unsaved work            | Follow the drawer's explicit confirm-close policy before discarding                               | Not applicable                                     |
| Current multi-step validation fails                 | Remain on the step, preserve values, show errors, and focus the first actionable error            | Owning validation error; no mutation               |
| Final multi-step submission fails                   | Remain on the final step, preserve safe values, and expose retry without duplicate submit         | Owning endpoint error                              |
| Multi-step target expires or permission is revoked  | Disable progression, explain the unavailable state, and provide a safe exit                       | `403`, `404`, or domain-specific expired response  |
| Multi-step flow has no available steps              | Render controlled configuration-empty UI and prevent submission                                   | Not applicable                                     |
| Tenant logo fails to load                           | Render deterministic Avatar fallback                                                              | Not applicable                                     |
| Long tenant name, email, or breadcrumb              | Truncate visually while preserving accessible text                                                | Not applicable                                     |
| Notification collection is empty                    | Show `No notifications`; do not show a fake item or dead inbox link                               | `200 OK` with empty data collection                |
| Notification request fails                          | Keep the header usable and show contextual retry inside the notification surface                  | Network/client failure or standardized API failure |
| Notification belongs to another user                | Return no resource information and perform no mutation                                            | `404 NOT_FOUND`                                    |
| Notification action URL is unsafe or unauthorized   | Render notification content without a navigable action; destination still performs authorization  | No client navigation / destination `403`           |
| Persisted appearance preference is invalid          | Clear it and resolve Light or Dark from the current device scheme; the fixed brand accent remains | Not applicable                                     |
| Theme changes in another dashboard tab              | Reconcile the persisted preference without leaving controls in a false selected state             | Not applicable                                     |
| Header width is constrained                         | Compact the breadcrumb/title first; keep all three essential actions usable and labeled           | Not applicable                                     |

---

## 16. Release Acceptance Criteria

The feature is ready for approval when all of the following are true:

- [ ] Merchant and platform layouts render through one generic workspace shell without duplicated sidebar markup.
- [ ] Protected routes validate the session and workspace before rendering protected content.
- [ ] The dashboard base URL renders the authorized workspace hub for zero, one, or multiple destinations without implicitly selecting a tenant.
- [ ] Tenant switching is backed by authorized workspace data and uses subdomain-aware route utilities.
- [ ] Navigation items and groups are permission-filtered without inline role checks.
- [ ] Desktop expanded, desktop icon-collapsed, mobile off-canvas, and keyboard-shortcut navigation behaviors are verified.
- [ ] Active and nested routes are highlighted correctly.
- [ ] The workspace-manager header shows the shared `Workspace Manager` breadcrumb/title plus notification, account, and appearance actions in the specified order, with no search control.
- [ ] Header, breadcrumbs, notification center, user menu, tenant switcher, and appearance control are accessible and responsive.
- [ ] One shared breadcrumb renderer supports route-aware ancestors, authorized dynamic labels, current-page semantics, compact mobile behavior, and stale-contribution cleanup.
- [ ] The avatar menu shows Admin for users with `PLATFORM:READ`, omits it completely otherwise, retains Workspaces as the hub return path, and never uses inline role comparisons.
- [ ] The notification bell uses the real session-scoped API, accurate unread state, 30-second polling, focus refresh, safe action URLs, and complete loading, success, empty, error, and expired-session behavior.
- [ ] No full-inbox link is rendered until an implemented notification page route exists.
- [ ] Light and Dark are the only selectable modes, explicit choices persist across dashboard subdomains, first use follows the device scheme without exposing a System option, and hydration does not flash the wrong mode; Electric Indigo remains fixed.
- [ ] Responsive contextual sidebar behavior works on desktop and mobile.
- [ ] Split view, drawer, and modal hosts are mounted at the authenticated shell boundary and do not affect public auth routes.
- [ ] The reusable multi-step flow provides accessible progress, current-step validation, value preservation, pending protection, error recovery, and explicit success behavior.
- [ ] Multi-step drawers use a large or resizable right-side desktop layout and a full-screen, safe-area-aware mobile layout with fixed header/footer and one scrollable body.
- [ ] Dirty drawer dismissal through Close, Escape, backdrop, and route changes follows the same explicit confirmation policy and restores focus correctly.
- [ ] The tenant root renders the structural workspace home without analytics, aggregate requests, or fabricated merchant data.
- [ ] The workspace hub reserves the future “Create store” placement without shipping an enabled non-functional control.
- [ ] Sign-in uses shared validation and Base UI Field composition and preserves account-enumeration protection.
- [ ] Sign-in uses the restrained two-column desktop presentation with a static commerce visual, no carousel, and a single-column mobile form.
- [ ] Callback destinations are validated before use.
- [ ] No fake navigation destinations or placeholder domain pages are introduced.
- [ ] No raw HTML form controls are introduced where shared primitives exist.
- [ ] Light theme, dark theme, keyboard navigation, reduced motion, 200% zoom, and mobile touch ergonomics are verified.
- [ ] `bun run verify` completes with zero warnings and zero errors.
- [ ] No build or database migration command is run as part of verification.

---

## 17. Aligned Product Decisions

1. **Auth visual direction**: use a restrained two-column desktop layout with one static commerce visual, no carousel, and a form-only mobile presentation.
2. **Tenant chat**: exclude tenant support chat from this feature and from the initial merchant navigation. Its permission key is deferred with the chat domain.
3. **Platform permissions**: establish `MODERATION:READ`, `QUEUES:READ`, and `PLATFORM:SETTINGS` in the canonical permission registry and session before those navigation items ship.
4. **Tenant creation entry point**: follow the useful parts of the Nexudy workspace pattern. The workspace hub reserves a prominent “Create store” action. A separate tenant-onboarding specification will implement its drawer flow and backend mutation; this feature does not ship a dead or simulated action.
5. **Workspace selector behavior**: always show the workspace hub at the dashboard base URL, even when the user has one tenant. The hub is a durable action surface for opening stores, creating a store when tenant onboarding ships, and accommodating future account-level actions. It MUST NOT auto-redirect based only on the number of authorized destinations. Direct tenant-subdomain URLs still enter that tenant immediately.
6. **Tenant home data scope**: keep this feature structural. It adds no aggregate endpoint, analytics query, metric card, fake production value, low-stock panel, or recent-order feed. A merchant-overview feature will specify those contracts separately.
7. **Drawer and multi-step architecture**: include the reusable stacked drawer host and domain-neutral `MultiStepFlow` in this foundation. Follow the useful Nexudy interaction pattern—right-side contextual drawer, visible step count, segmented progress, scrollable body, and fixed Back/Next actions—while correcting its architecture for Base UI, strict typing, guarded step validation, responsive full-screen mobile behavior, and unsaved-change protection. The concrete store-creation fields and mutation remain in the separate tenant-onboarding feature.
8. **Platform entry in the avatar menu**: reproduce the demonstrated Nexudy placement with an “Admin” item between workspace/account destinations and Sign Out. Render it when `PLATFORM:READ` is present, which covers platform admins and staff without hardcoding roles; route it to the admin subdomain through the centralized URL utilities.
9. **Breadcrumb architecture**: follow Nexudy's useful shell pattern—pages contribute context and one shared header component renders it beside the sidebar trigger. Use Hono Commerce's existing Base UI breadcrumb primitives, keep route/domain resolution in `apps/dashboard`, show the current page on compact screens, support authorized dynamic resource names, and clear route-owned contributions on navigation.
10. **Workspace-manager header**: use the shared breadcrumb/header component with `Workspace Manager` on the left. On the right, render notification bell, account avatar, and appearance palette in that order. Do not render Nexudy's search control, messaging control, or AI control on this page, and do not show a tenant-sidebar trigger at the dashboard root.
11. **Notification center**: complete the persistent notification contract already established by specification `002` using the existing schema, a session-scoped Hono RPC list/read API, TanStack Query smart polling every 30 seconds, and focus refresh. Start with a recent-notification popover/Sheet and omit `View all` until a dedicated inbox route is real.
12. **Appearance scope**: retain Nexudy's useful palette-button and right-side panel pattern, but expose only Light and Dark. With no saved choice, initialize from the device scheme; after an explicit selection, persist it across dashboard subdomains. Do not expose System or a reset-to-system action. Electric Indigo remains fixed. Defer accent selection, density, sidebar-mode, and visual-style customization; continue respecting system reduced-motion settings without adding a feature-specific toggle.
