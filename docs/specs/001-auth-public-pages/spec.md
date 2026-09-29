# Feature Specification: Public Auth & Management Pages

**Feature ID**: `001-auth-public-pages`  
**Status**: `Draft`  
**Architecture Reference**: `docs/architecture/authentication-architecture.md`, `docs/architecture/routing-and-proxy-architecture.md`  
**Target Packages**: `packages/types`, `apps/dashboard`, `apps/api`

---

## 1. Overview & Objective

Currently, `apps/dashboard` strictly isolates management routes behind authenticated subdomain route groups (`/(admin)/admin/*` and `/(tenant)/[slug]/*`). However, the platform requires public, unauthenticated (or semi-authenticated) entry points for:

1. **Email Verification**: Landing page when a user clicks an email verification link sent by Better Auth.
2. **Organization / Tenant Invitation**: Landing page when a staff member or store operator is invited to join a tenant workspace.
3. **Password Reset**: Landing page with a secure token input/form to set a new password.

These pages must be globally accessible without redirect loops, render clean error states for expired/invalid tokens, and redirect seamlessly to the merchant or admin portal upon completion.

---

## 2. User Stories & Acceptance Scenarios

### User Story 1: Email Verification Landing

> As a **new user**,  
> I want to **click a verification link from my email and see instant confirmation**,  
> So that **my account is activated and I can access my store**.

- **Scenario 1.1 (Valid Token)**:
  - **Given** a user clicks `http://localhost:3002/verify-email?token=valid_token`
  - **When** the page loads
  - **Then** the page calls Better Auth verification, displays success confirmation, and provides a CTA to continue to their store workspace.
- **Scenario 1.2 (Expired / Invalid Token)**:
  - **Given** a user clicks an expired or already-used verification link
  - **When** the verification API returns an error
  - **Then** the page displays a friendly alert ("Verification link expired") with a button to "Resend verification email".

### User Story 2: Workspace Invitation Acceptance

> As an **invited merchant team member**,  
> I want to **view the invitation details and accept or decline**,  
> So that **I am granted the designated role in the store**.

- **Scenario 2.1 (Authenticated Accept)**:
  - **Given** an authenticated user visits `http://localhost:3002/invitations/[invitationId]`
  - **When** clicking "Accept Invitation"
  - **Then** the member is added to the tenant, session permissions update, and user is redirected to `http://[slug].localhost:3002/products`.
- **Scenario 2.2 (Unauthenticated Accept)**:
  - **Given** an unauthenticated visitor clicks an invitation link
  - **When** the page loads
  - **Then** it prompts them to Sign Up or Log In first, preserving the invitation callback return URL.

---

## 3. Invariants & Platform Guardrails (RFC 2119)

- **`MUST`**: Public auth pages MUST be mounted outside the authenticated tenant/admin route groups (e.g. `apps/dashboard/src/app/(public)/*`).
- **`MUST NOT`**: Next.js proxy MUST NOT rewrite public auth pages (`/verify-email`, `/invitations/*`, `/reset-password`) into `/[slug]/*`.
- **`MUST`**: All routes MUST be registered in `@hono-commerce/types/routes` catalog (`routes.auth.verifyEmail`, `routes.auth.invitation`, etc.).

---

## 4. Security & Permissions

- Verification tokens are single-use and cryptographically verified by Better Auth.
- Invitations are tenant-scoped and expire after 7 days.
