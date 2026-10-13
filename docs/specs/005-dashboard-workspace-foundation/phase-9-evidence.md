# Phase 9 implementation evidence

## Automated verification

- `bun run check-types` passed across all workspace packages.
- `bun run check` passed Oxlint and formatting with zero reported issues.
- `bun run verify` passed type checks, lint, and formatting with zero errors and warnings.
- No build command was run.
- No database schema or migration files were changed.

## Implemented acceptance coverage

- Public sign-in uses the existing static SVG visual, shared Field primitives, React Hook Form, and the shared Zod schema.
- Better Auth and Hono share the `/api/v1/auth` base path, and every Better Auth method is forwarded through the Hono mount.
- Better Auth generates UUIDs for its UUID-backed user, session, account, and verification records.
- Magic-link creation, email copy, and verification use the same 15-minute expiry; the email exposes only the actionable verification link.
- Magic-link verification preserves only safe same-origin callback paths and falls back to the workspace hub.
- Dashboard root, admin, and tenant subdomains are trusted deliberately, receive credentialed CORS, and share the session cookie through the configured parent domain. Unrelated origins receive no CORS grant.
- Anonymous users receive `401 UNAUTHORIZED` from workspace APIs and are redirected before workspace, tenant, or platform shells render.
- Tenant layouts authorize active membership through `GET /tenants/:tenantId/workspace`; unauthorized and missing tenants fail closed.
- Platform layouts authorize `PLATFORM:READ` on the server before rendering platform children.
- Authenticated suspended/deactivated accounts render an account-unavailable state instead of the sign-in form.
- Server-owned role, status, and ban state cannot be supplied by public auth input; custom session permissions are inferred from the server auth contract.
- The root workspace hub remains visible and does not auto-redirect based on workspace count.
- Platform navigation is permission-gated with `PLATFORM:READ`; UI does not inspect role names.
- Notification state uses typed RPC hooks with polling, focus refresh, read mutation, empty, loading, and error presentations.
- Appearance exposes only Light and Dark while the first visit follows the device preference internally.
- Notification and appearance actions switch from desktop popovers to titled mobile sheets.
- The global drawer has a stable external-store server snapshot and full-width mobile presentation.

## Manual runtime checks remaining

Executable Hono checks covered unauthenticated sessions, invalid magic-link input, protected workspace `401` responses, accepted tenant-subdomain CORS, rejected external-origin CORS, and the effective Better Auth runtime configuration. Live browser checks for the full email click/cookie redirect and zero/one/multiple authorized workspace fixtures remain unchecked because `agent-browser` is not installed and no authorized browser fixture is available. Install `agent-browser >= 0.31.1`, restart the API/dashboard/worker processes, and run those checks before release.
