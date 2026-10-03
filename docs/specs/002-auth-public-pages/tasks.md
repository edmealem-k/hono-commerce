# Tasks: Public Auth & Management Pages

**Feature ID**: `002-auth-public-pages`  
**Specification**: `docs/specs/002-auth-public-pages/spec.md`  
**Plan**: `docs/specs/002-auth-public-pages/plan.md`

---

## Phase 1: Route Contracts (`packages/types`)

- [ ] 1.1 Add `verifyEmail`, `resetPassword`, and `invitation` to `routeCatalog.auth`
- [ ] 1.2 Validate types compile with `bun run check-types`

---

## Phase 2: Proxy Exclusions (`apps/dashboard`)

- [ ] 2.1 Update `apps/dashboard/src/proxy.ts` to exclude public auth paths from tenant slug rewrites
- [ ] 2.2 Verify root domain and subdomain proxy handling for public paths

---

## Phase 3: Public UI Pages (`apps/dashboard`)

- [ ] 3.1 Scaffold `apps/dashboard/src/app/(public)/layout.tsx`
- [ ] 3.2 Build Email Verification landing page (`apps/dashboard/src/app/(public)/verify-email/page.tsx`)
- [ ] 3.3 Build Password Reset form (`apps/dashboard/src/app/(public)/reset-password/page.tsx`)
- [ ] 3.4 Build Workspace Invitation page (`apps/dashboard/src/app/(public)/invitations/[invitationId]/page.tsx`)

---

## Phase 4: Verification & Convergence Gate

- [ ] 4.1 Run `bun run verify` (0 errors, 0 warnings)
- [ ] 4.2 Manually verify email verification and invitation acceptance flows in browser
