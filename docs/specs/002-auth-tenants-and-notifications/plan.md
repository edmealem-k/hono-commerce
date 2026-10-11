# Technical Implementation Plan: Auth, Multi-Tenancy, and Notification Engine

**Feature ID**: `002-auth-tenants-and-notifications`  
**Specification**: `docs/specs/002-auth-tenants-and-notifications/spec.md`

---

## 1. Monorepo Package Impact Matrix

| Package / App           |   Impact   | Scope of Changes                                                                                                                                                              |
| :---------------------- | :--------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/db`           |  **High**  | Add `schema/tenant.ts`, `schema/notification.ts`, extend `schema/auth.ts` with native `uuid().primaryKey().defaultRandom()` and `pgEnum`                                      |
| `packages/auth`         |  **High**  | Configure `magicLink` and `admin` plugins; decouple multi-tenancy to custom Hono modules; add `packages/auth/src/jwt.ts` (`jose`); wire email hooks to `@hono-commerce/queue` |
| `packages/queue`        | **Medium** | Add `packages/queue/src/jobs/notification.ts` for asynchronous worker fan-out queue with scoped idempotency keys                                                              |
| `packages/notification` |  **High**  | Role-targeted per-user in-app and email fan-out; strongly type `targetRoles?: MerchantRole[]` & `systemRoles?: PlatformRole[]`                                                |
| `apps/worker`           | **Medium** | Implement consumer for `tenant-notifications-fanout` to resolve active members, insert per-user in-app records, and dispatch emails                                           |
| `packages/types`        | **Medium** | Single source of truth types derived from Drizzle `pgEnum`; register public routes in `routes/catalog.ts`                                                                     |
| `apps/dashboard`        |  **High**  | Implement 2-step sliding sign-in card and authenticated invitation onboarding in `(public)/*`; update Next.js 16 `proxy.ts` public route bypass                               |

---

## 2. Database Schema Blueprint (`packages/db`)

### A. Auth Schema (`packages/db/src/schema/auth.ts`)

```ts
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "customer"]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "deactivated",
]);

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: userRoleEnum("role").default("customer").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  banned: boolean("banned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeTenantId: uuid("active_tenant_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("account_issuer_accountId_uidx").on(
      table.issuer,
      table.accountId,
    ),
    index("account_userId_idx").on(table.userId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);
```

### B. Tenant & Membership Schema (`packages/db/src/schema/tenant.ts`)

```ts
import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "suspended",
  "maintenance",
]);

export const tenantMemberRoleEnum = pgEnum("tenant_member_role", [
  "owner",
  "member",
]);

export const tenantMemberStatusEnum = pgEnum("tenant_member_status", [
  "active",
  "suspended",
]);

export const tenantInvitationStatusEnum = pgEnum("tenant_invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "canceled",
]);

// 1. Tenant (Store / Organization)
export const tenant = pgTable("tenant", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  status: tenantStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// 2. Tenant Member
export const tenantMember = pgTable(
  "tenant_member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: tenantMemberRoleEnum("role").default("member").notNull(),
    status: tenantMemberStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("tenant_member_user_idx").on(table.tenantId, table.userId),
    index("tenant_member_tenant_idx").on(table.tenantId),
  ],
);

// 3. Tenant Invitation
export const tenantInvitation = pgTable(
  "tenant_invitation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: tenantMemberRoleEnum("role").default("member").notNull(),
    status: tenantInvitationStatusEnum("status").default("pending").notNull(),
    inviterId: uuid("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("tenant_invitation_tenant_idx").on(table.tenantId),
    index("tenant_invitation_email_idx").on(table.email),
    index("tenant_invitation_lookup_idx").on(
      table.tenantId,
      table.email,
      table.status,
    ),
  ],
);
```

### C. Persistent Notifications Schema (`packages/db/src/schema/notification.ts`)

```ts
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { tenant } from "./tenant";

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id").references(() => tenant.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    actionUrl: text("action_url"),
    metadata:
      jsonb("metadata").$type<
        Record<string, string | number | boolean | null>
      >(),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_user_unread_idx").on(
      table.userId,
      table.isRead,
      table.createdAt,
    ),
    index("notification_tenant_idx").on(table.tenantId, table.createdAt),
  ],
);

export const notificationPreference = pgTable("notification_preference", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  enabledChannels: jsonb("enabled_channels")
    .$type<string[]>()
    .default(["inApp", "email"])
    .notNull(),
  mutedNotificationTypes: jsonb("muted_notification_types")
    .$type<string[]>()
    .default([])
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
```

---

## 3. Better Auth Configuration (`packages/auth/src/index.ts`)

```ts
import { createDb } from "@hono-commerce/db";
import * as schema from "@hono-commerce/db/schema";
import { env } from "@hono-commerce/env/api";
import { enqueueEmail } from "@hono-commerce/queue";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { magicLink } from "better-auth/plugins/magic-link";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    trustedOrigins: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    emailAndPassword: { enabled: false }, // Passwordless Magic-Link Only
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      generateId: () => crypto.randomUUID(), // Guarantees valid UUIDv4
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    user: {
      additionalFields: {
        status: {
          type: "string",
          defaultValue: "active",
        },
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, token, url }) => {
          await enqueueEmail({
            to: email,
            subject: "Your sign-in link for Hono Commerce",
            template: "magic-link",
            props: {
              actionUrl: url,
              token,
              expiresInMinutes: 15,
            },
          });
        },
      }),
      admin({
        defaultRole: "customer",
        adminRoles: ["admin", "staff"],
      }),
    ],
  });
}
```

---

## 4. Centralized JWT Cryptographic Engine (`packages/auth/src/jwt.ts`)

Powered by `jose` (Web Crypto API):

```ts
import { env } from "@hono-commerce/env/api";
import { SignJWT, jwtVerify, decodeJwt } from "jose";
import type { MerchantRole, PlatformRole } from "./permissions";

const SECRET_KEY = new TextEncoder().encode(env.BETTER_AUTH_SECRET);
const ISSUER = "hono-commerce";

export type InvitationTokenPayload = {
  type: "invitation";
  invitationId: string; // Links to tenant_invitation.id for single-use & revocation
  tenantId: string;
  email: string;
  role: MerchantRole;
  inviterId: string;
};

export type EmailVerificationTokenPayload = {
  type: "email-verification";
  userId: string;
  email: string;
};

export type StaffDelegationTokenPayload = {
  type: "staff-delegation";
  staffUserId: string;
  targetTenantId: string;
  grantedRole: PlatformRole;
};

export type OneClickUnsubscribeTokenPayload = {
  type: "unsubscribe";
  userId: string;
  notificationType: string;
};

export type AuthTokenPayload =
  | InvitationTokenPayload
  | EmailVerificationTokenPayload
  | StaffDelegationTokenPayload
  | OneClickUnsubscribeTokenPayload;

export type VerifyJwtResult<T> =
  | { success: true; payload: T }
  | {
      success: false;
      error: "EXPIRED" | "INVALID_SIGNATURE" | "MALFORMED" | "TYPE_MISMATCH";
    };

export async function signJwt<T extends AuthTokenPayload>(
  payload: T,
  options?: { expiresIn?: string | number },
): Promise<string> {
  const expiresIn = options?.expiresIn ?? "7d";

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
}

export async function verifyJwt<T extends AuthTokenPayload>(
  token: string,
  expectedType?: T["type"],
): Promise<VerifyJwtResult<T>> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: ISSUER,
      algorithms: ["HS256"],
    });

    const typedPayload = payload as unknown as T;
    if (expectedType && typedPayload.type !== expectedType) {
      return { success: false, error: "TYPE_MISMATCH" };
    }

    return { success: true, payload: typedPayload };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "JWTExpired") {
      return { success: false, error: "EXPIRED" };
    }
    if (err instanceof Error && err.name === "JWSSignatureVerificationFailed") {
      return { success: false, error: "INVALID_SIGNATURE" };
    }
    return { success: false, error: "MALFORMED" };
  }
}

export function decodeJwtUnsafe<T extends AuthTokenPayload>(
  token: string,
): T | null {
  try {
    return decodeJwt(token) as unknown as T;
  } catch {
    return null;
  }
}
```

---

## 5. Modular API Architecture & Invitation Lifecycle (`apps/api`)

Following the Vertical Slice and One-File-Per-Handler pattern, all domain logic is organized under `apps/api/src/modules/<domain>/`:

```text
packages/types/src/schemas/invitation.ts      # Shared Zod validation schemas (FE & BE)

apps/api/src/modules/invitations/
├── invitations.routes.ts                     # Declarative router mapping
└── handlers/                                 # Dedicated, single-purpose handlers
    ├── resolve-invitation.ts                 # GET /:invitationId?token=...
    └── update-status.ts                      # PATCH /:invitationId ({ status, token })

apps/api/src/modules/tenants/
├── tenants.routes.ts                         # Declarative router mapping
└── handlers/
    ├── create-invitation.ts                  # POST /:tenantId/invitations
    ├── list-invitations.ts                   # GET /:tenantId/invitations
    ├── resend-invitation.ts                  # POST /:tenantId/invitations/:invitationId/resend
    └── cancel-invitation.ts                  # DELETE /:tenantId/invitations/:invitationId
```

### A. Preview / Resolve Endpoint (`GET /api/v1/invitations/:invitationId?token=...`)

1. Handled by `modules/invitations/handlers/resolve-invitation.ts`.
2. Validates query input with `resolveInvitationQuerySchema`.
3. Verifies signed JWT token using `verifyJwt(token, "invitation")`.
4. Queries `tenant_invitation` and joins `tenant` and `user` (inviter) for preview metadata:
   - Store name, store slug, store logo
   - Invited email, assigned role (`owner` | `member`)
   - Inviter name
   - Current status (`pending`, `accepted`, `rejected`, `canceled`)
5. Returns `200 OK` with `{ data: preview }`.

### B. Unified Status Update Endpoint (`PATCH /api/v1/invitations/:invitationId`)

1. Handled by `modules/invitations/handlers/update-status.ts`.
2. Validates body input with `updateInvitationStatusSchema`:
   ```json
   {
     "status": "accepted",
     "token": "signed-jwt-token"
   }
   ```
3. Verifies signed JWT token using `verifyJwt(token, "invitation")`. Rejects if token expired or invalid signature (`401 Unauthorized`).
4. Executes atomic single-use status transition within a database transaction:
   ```sql
   UPDATE tenant_invitation
   SET status = :status
   WHERE id = :invitationId AND status = 'pending';
   ```
   If 0 rows affected $\to$ throw `409 Conflict` ("Invitation has already been resolved or canceled").
5. If `status === "accepted"`:
   - Validates authenticated user session (`c.get("user")`).
   - Inserts or activates membership in `tenant_member`:
     ```sql
     INSERT INTO tenant_member (id, tenant_id, user_id, role, status)
     VALUES (:id, :tenantId, :userId, :role, 'active')
     ON CONFLICT (tenant_id, user_id)
     DO UPDATE SET role = EXCLUDED.role, status = 'active';
     ```
6. Returns `200 OK` with `{ data: { success: true, status } }`.

---

## 6. Role-Targeted Notification Architecture

### A. In-App Notification Center: Smart Polling (`apps/dashboard` & TanStack Query)

- Handled by `apps/api/src/modules/notifications/handlers/list-notifications.ts` mounted under `GET /api/v1/users/me/notifications`.
- The dashboard header notification bell and dropdown consume this endpoint via Hono RPC (`apiClient`):
  ```ts
  const { data: notifications } = useQuery({
    queryKey: ["notifications", "me"],
    queryFn: async () => {
      const res = await apiClient.api.v1.users.me.notifications.$get();
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const { data } = await res.json();
      return data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
    refetchOnWindowFocus: true, // Immediately refresh on tab focus
  });
  ```
- This completely eliminates persistent WebSocket connection drops, socket authentication handshakes, and idle server load while delivering snappy, reliable notification counts.

### B. Asynchronous Fan-Out Worker (`packages/queue/src/jobs/notification.ts` & `apps/worker`)

- When `channels.email` is true, API enqueues `tenant-notifications-fanout` job to BullMQ.
- Worker queries active members (`status = 'active'`) matching `targetRoles`, evaluates preferences, and dispatches individual `enqueueEmail` jobs.

---

## 7. UI Architecture: Public Pages (`apps/dashboard/src/app/(public)`)

Directory layout:

```text
apps/dashboard/src/app/(public)/
├── layout.tsx                     # Centered card layout (max-w-md), subtle gradient, theme toggle
├── sign-in/
│   └── page.tsx                   # Magic link request form with 6-state matrix (Initial, Loading, Sent, Error)
├── verify/
│   └── page.tsx                   # Magic link callback landing & auto-redirect
└── invitations/
    └── [invitationId]/
        └── page.tsx               # Store identity header, status pill, role badge, Accept / Decline buttons
```

### Proxy Bypass (`apps/dashboard/src/proxy.ts`)

```ts
const PUBLIC_PATHS = ["/sign-in", "/verify", "/invitations"];
```

Requests matching `PUBLIC_PATHS` bypass tenant slug rewrites.
