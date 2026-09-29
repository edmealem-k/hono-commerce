# Technical Implementation Plan: Public Auth & Management Pages

**Feature ID**: `001-auth-public-pages`  
**Specification**: `docs/specs/001-auth-public-pages/spec.md`

---

## 1. Monorepo Package Impact Matrix

| Package / App    |   Impact   | Scope of Changes                                                             |
| :--------------- | :--------: | :--------------------------------------------------------------------------- |
| `packages/types` | **Medium** | Add route keys to `routes.auth.*` in `routes/catalog.ts`                     |
| `apps/dashboard` |  **High**  | Proxy bypass rules in `proxy.ts`, new route group `(public)` with page views |
| `apps/api`       |  **Low**   | Ensure Better Auth email callbacks point to dashboard public routes          |

---

## 2. Route Catalog Additions (`packages/types/src/routes/catalog.ts`)

```ts
export const routeCatalog = {
  auth: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    signOut: "/sign-out",
    verifyEmail: "/verify-email",
    resetPassword: "/reset-password",
    invitation: ({ invitationId }: { invitationId: string }) =>
      `/invitations/${invitationId}`,
  },
  // ...
};
```

---

## 3. Proxy Route Exclusions (`apps/dashboard/src/proxy.ts`)

Update `isReservedSubdomain` and public path matching in `proxy.ts`:

```ts
const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/reset-password",
  "/invitations",
];
```

Requests matching `PUBLIC_PATHS` serve the root app directly and bypass tenant subdomain slug rewrites.

---

## 4. UI Architecture (`apps/dashboard/src/app/(public)`)

Directory structure:

```text
apps/dashboard/src/app/(public)/
├── layout.tsx                     # Centered clean card layout with theme toggle
├── verify-email/
│   └── page.tsx                   # Client component with token evaluation & status pills
├── reset-password/
│   └── page.tsx                   # New password form with strength indicators
└── invitations/
    └── [invitationId]/
        └── page.tsx               # Invitation card with Accept / Decline actions
```

Component styling uses Base UI primitives (`@hono-commerce/ui/components/*`).
