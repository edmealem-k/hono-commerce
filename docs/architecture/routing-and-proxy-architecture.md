# Multi-Tenant Routing, Edge Proxy & Route Management Architecture

**Document Version**: 1.0.0  
**Status**: Approved Architecture Blueprint  
**Target Stack**: Next.js 16 (App Router), `proxy.ts` (Node.js runtime), TypeScript, RFC 6761 `*.localhost` Subdomains.

---

## 1. Executive Summary & Subdomain Invariant

In both **local development** and **production environments**, `hono-commerce` strictly enforces a **subdomain-first architecture**.

### The Subdomain Invariant

> **Visible browser URLs NEVER expose the tenant slug in the path.**
>
> - Users access store management at `[slug].localhost:3002/products` (dev) or `[slug].shop.com/products` (prod).
> - Users access superadmin management at `admin.localhost:3002/tenants` (dev) or `admin.shop.com/tenants` (prod).
> - Next.js internal file routing (`(tenant)/[slug]/...` and `(admin)/admin/...`) is completely decoupled from visible browser URLs via silent internal rewrites in `proxy.ts`.

---

## 2. Local Development Subdomain Networking (RFC 6761)

According to **[RFC 6761 (Special-Use Domain Names)](https://datatracker.ietf.org/doc/html/rfc6761)**, all modern web browsers (Chrome, Firefox, Safari, Edge) and operating systems resolve any domain ending in `.localhost` directly to loopback IP `127.0.0.1` without sending DNS queries or requiring `/etc/hosts` entries.

### Development Port Topology

| Service                  | Local Subdomain / URL            | Production URL                  | Description                              |
| :----------------------- | :------------------------------- | :------------------------------ | :--------------------------------------- |
| **API Server**           | `http://localhost:3000/api/v1/*` | `https://api.shop.com/api/v1/*` | Hono REST & Typed RPC API                |
| **Storefront**           | `http://[slug].localhost:3001/*` | `https://[slug].shop.com/*`     | Branded customer storefront              |
| **Merchant Dashboard**   | `http://[slug].localhost:3002/*` | `https://[slug].shop.com/*`     | Store management & operator portal       |
| **Superadmin Dashboard** | `http://admin.localhost:3002/*`  | `https://admin.shop.com/*`      | Platform governance, queues & moderation |
| **Portal Root**          | `http://localhost:3002/`         | `https://dashboard.shop.com/`   | Store selector / redirector              |

_Example_: Visiting `http://nike.localhost:3002/orders` in your browser works immediately out-of-the-box on port 3002.

---

## 3. Next.js 16 Edge Proxy Architecture (`proxy.ts`)

Next.js 16 deprecates `middleware.ts` in favor of **`proxy.ts`** running on the Node.js runtime.

### Processing Pipeline

```mermaid
flowchart TD
    Req["Incoming HTTP Request<br/>(e.g., nike.localhost:3002/products)"] --> StripHeaders["Strip Untrusted Headers<br/>requestHeaders.delete('x-tenant-slug')"]
    StripHeaders --> HostExtract["Extract Hostname<br/>nike.localhost"]

    HostExtract --> CheckAdmin{"Hostname == admin.*?"}
    CheckAdmin -- Yes --> AdminRewrite["Admin Proxy:<br/>Rewrite to /admin/products"]

    CheckAdmin -- No --> CheckSubdomain{"Has Tenant Subdomain?"}
    CheckSubdomain -- No --> Fallback["Serve Root / (Portal Selector)"]

    CheckSubdomain -- Yes --> ValidateSlug{"RFC Regex & Reserved Check"}
    ValidateSlug -- Invalid --> Reject["400 Bad Request: Invalid store identifier"]
    ValidateSlug -- Valid --> TenantRewrite["Tenant Proxy:<br/>1. Set x-tenant-slug = 'nike'<br/>2. Rewrite internally to /nike/products"]

    TenantRewrite --> AppRouter["Next.js App Router Page Renderer<br/>(params: { slug: 'nike' })"]
    AdminRewrite --> AppRouter
```

### Security & Invariants

1. **Header Injection Prevention**: The proxy strips any incoming client `x-tenant-slug` header before processing to prevent malicious header spoofing.
2. **Strict Regex Validation**: Subdomain labels must match `/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/`.
3. **Reserved Subdomains**: Subdomains such as `admin`, `api`, `auth`, `www`, `app`, `static`, `assets`, `cdn`, and `localhost` cannot be claimed by tenants.

---

## 4. Centralized & Scalable Route Management

### The Problem

Hardcoded URL strings (e.g. `` `/products` ``, `` `/${slug}/orders/${order.id}` ``) cause:

1. **Broken Links**: Renaming a route breaks unlinked strings without TypeScript errors.
2. **Prop Drilling**: Passing `slug` down component trees just to build links.
3. **Environment Discrepancies**: Inconsistent absolute URL generation for emails and webhooks.

### The Solution: Direct & Scalable Route Catalog

```mermaid
flowchart LR
    Catalog["1. Central Route Catalog<br/>(@hono-commerce/types/routes)"] --> DirectUse["2. Direct Component Usage<br/>(routes.tenant.products, routes.tenant.order({ orderId }))"]
    Catalog --> ClientHook["3. Client Hook: useRoutes()<br/>(Auto-resolves current slug from useParams)"]
```

#### Layer 1: Single Source of Truth (`@hono-commerce/types/routes`)

Defined in `packages/types/src/routes/catalog.ts`:

- **Static routes** are simple string constants:
  - `routes.tenant.products` (`"/products"`)
  - `routes.tenant.orders` (`"/orders"`)
  - `routes.admin.tenants` (`"/tenants"`)
- **Parameterized routes** are lightweight functions accepting typed parameter objects:
  - `routes.tenant.order({ orderId: string })` (`/orders/${orderId}`)
  - `routes.tenant.product({ productId: string })` (`/products/${productId}`)
  - `routes.admin.tenant({ tenantId: string })` (`/tenants/${tenantId}`)
  - `routes.storefront.product({ handle: string })` (`/products/${handle}`)

#### Layer 2: Natural Type Inference & Next.js `typedRoutes` Decision

Next.js 16 features an experimental `typedRoutes: true` compiler option. However, `typedRoutes` validates `<Link href>` strictly against physical disk folders (`src/app/(tenant)/[slug]/products`). In our subdomain-first architecture, browser URLs are rewritten silently by `proxy.ts` so users visit clean paths (`/products`, `/tenants`).

Because Next.js's filesystem router has no awareness of subdomain proxy rewrites, `typedRoutes: true` flags clean paths as non-existent routes, forcing developers into dangerous type assertions (`as Route` or `as any`) or clashing `.d.ts` module overrides.

**Decision (ADR-004)**: `typedRoutes: true` is disabled in `next.config.ts`. Full type safety is maintained via the centralized `@hono-commerce/types/routes` catalog:

- Parameterless routes are simple string properties.
- Parameterized routes require exact parameter objects.
- Zero type assertions (`as Route` or `as any`) are required anywhere in application components.

```tsx
import { routes } from "@/lib/routes";
import Link from "next/link";

export function Sidebar() {
  return (
    <nav>
      {/* Parameterless routes are simple string properties */}
      <Link href={routes.tenant.products}>Products</Link>
      <Link href={routes.tenant.orders}>Orders</Link>
    </nav>
  );
}

export function OrderRow({ order }: { order: { id: string } }) {
  return (
    {/* Parameterized routes accept strongly-typed objects */}
    <Link href={routes.tenant.order({ orderId: order.id })}>
      View Order
    </Link>
  );
}
```

#### Layer 3: Centralized Origin & Subdomain Resolution (`getBaseUrl` & `toSubdomainUrl`)

Provided universally in `@hono-commerce/types/routes` for both server and client environments:

```ts
import {
  getBaseUrl,
  toSubdomainUrl,
  routes,
} from "@hono-commerce/types/routes";

// 1. Get origin for a tenant dashboard
getBaseUrl({ subdomain: "nike", portal: "dashboard" });
// Dev:  "http://nike.localhost:3002"
// Prod: "https://nike.localhost:3002" (or custom root domain)

// 2. Build full cross-subdomain URL
const storeUrl = toSubdomainUrl("default", routes.tenant.products);
// Dev:  "http://default.localhost:3002/products"
// Prod: "https://default.localhost:3002/products"
```

#### Layer 4: Client Hook (`useRoutes`)

When client components need the active tenant slug without prop-drilling:

```tsx
"use client";

import { useRoutes } from "@/lib/routes";

export function StoreHeader() {
  const { slug, routes } = useRoutes();
  return <div>Store: {slug}</div>;
}
```

---

## 5. Public Routes & Route Group Architecture (`apps/dashboard/src/app/(public)`)

Because `apps/dashboard` has a small number of public landing and authentication pages, all public pages are organized under a dedicated **`(public)` route group** for clean isolation from tenant and admin layouts:

```text
apps/dashboard/src/app/
├── (admin)/                       # Superadmin portal (admin.localhost:3002)
├── (tenant)/[slug]/               # Merchant store portal ([slug].localhost:3002)
└── (public)/                      # Public auth & token resolution gateway
    ├── layout.tsx                 # Centered card layout (max-w-md, brand hero, subtle gradient)
    ├── sign-in/
    │   └── page.tsx               # Passwordless magic link request form
    ├── verify/
    │   └── page.tsx               # Magic link callback landing & auto-redirect
    └── invitations/
        └── [invitationId]/
            └── page.tsx           # Store identity, status pill, role badge, Accept / Decline actions
```

### Proxy Bypass (`apps/dashboard/src/proxy.ts`)

Public paths match `PUBLIC_PATHS` and bypass tenant slug rewrites, serving the `(public)` route group directly on root host or subdomains:

```ts
const PUBLIC_PATHS = ["/sign-in", "/verify", "/invitations"];
```

---

## 6. Summary of Conventions for AI Agents & Developers

1. **Always develop using subdomains**:
   - Open `http://nike.localhost:3002` for store features.
   - Open `http://admin.localhost:3002` for superadmin features.
2. **Never hardcode string paths in UI components**:
   - Use `routes.tenant.*` or `routes.admin.*` from `@/lib/routes`.
   - Never write type assertions (`as Route` or `as any`). Let TypeScript infer types naturally.
3. **Never expose `/[slug]` in visible browser URLs**:
   - `proxy.ts` silently handles internal folder routing. Visible URLs must remain `/products`, `/orders`, etc.
4. **Follow Agentic SDD for New Routes**:
   - Register new route patterns in `packages/types/src/routes/catalog.ts` before creating views.
