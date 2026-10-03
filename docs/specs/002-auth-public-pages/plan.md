# Technical Implementation Plan: Public Auth & Management Pages

**Feature ID**: `002-auth-public-pages`  
**Specification**: `docs/specs/002-auth-public-pages/spec.md`

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

## 4. UI Architecture & Design System Integration (`apps/dashboard/src/app/(public)`)

All public pages strictly adhere to [`packages/ui/DESIGN.md`](file:///home/edmealem.k/Downloads/hono-commerce/packages/ui/DESIGN.md) and [`ui-ux-pro-max`](file:///home/edmealem.k/Downloads/hono-commerce/.agents/skills/ui-ux-pro-max/SKILL.md) guidelines:

Directory structure:

```text
apps/dashboard/src/app/(public)/
├── layout.tsx                     # Centered card layout (max-w-md), subtle radial glow, theme toggle
├── verify-email/
│   └── page.tsx                   # Token validation states (Loading pulse, Success pill, Expired recovery CTA)
├── reset-password/
│   └── page.tsx                   # Password reset with live strength indicator & accessible focus rings
└── invitations/
    └── [invitationId]/
        └── page.tsx               # Linear-style invitation card (Store avatar, role pill, Accept / Decline)
```

### State Specifications (6-State Matrix):

- **Email Verification**:
  - _Loading_: Pulsing mail icon (`size-10 text-primary animate-pulse`), `text-muted-foreground` helper text.
  - _Success_: Emerald `StatusPill` (`tone="success"`), bold confirmation, and auto-redirect countdown.
  - _Expired / Error_: Clear explanation alert, primary "Request new link" action.
- **Invitation Card**:
  - Store identity header with tenant avatar and monospace slug pill.
  - Clear role badge (`StatusPill` with `tone="primary"`).
  - Explicit button pairing: `Accept Invitation` (Primary `Button` with loading state) and `Decline` (`Button variant="ghost"`).
