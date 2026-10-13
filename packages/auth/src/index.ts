import { createDb } from "@hono-commerce/db";
import * as authSchema from "@hono-commerce/db/schema/auth";
import { env } from "@hono-commerce/env/api";
import { enqueueEmail } from "@hono-commerce/queue";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, customSession, magicLink } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

import { createAuthOriginPolicy } from "./origins";
import { getPermissionsForRole } from "./permissions";

export const authOriginPolicy = createAuthOriginPolicy({
  corsOrigins: env.CORS_ORIGIN,
  dashboardUrl: env.DASHBOARD_URL,
});

export function createAuth() {
  const db = createDb();
  const isProduction = env.NODE_ENV === "production";

  const options = {
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        ...authSchema,
      },
    }),
    trustedOrigins: authOriginPolicy.trustedOrigins,
    emailAndPassword: {
      enabled: false,
    },
    user: {
      additionalFields: {
        status: {
          type: "string",
          defaultValue: "active",
          input: false,
        },
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/v1/auth",
    advanced: {
      database: {
        generateId: "uuid",
      },
      crossSubDomainCookies: {
        enabled: true,
        domain:
          env.BETTER_AUTH_COOKIE_DOMAIN ?? new URL(env.DASHBOARD_URL).hostname,
      },
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: isProduction,
        httpOnly: true,
      },
    },
    plugins: [
      magicLink({
        expiresIn: 15 * 60,
        sendMagicLink: async ({ email, url }) => {
          await enqueueEmail({
            to: email,
            subject: "Your sign-in link for Hono Commerce",
            template: "magic-link",
            props: {
              actionUrl: url,
              expiresInMinutes: 15,
            },
          });
        },
      }),
      admin({
        defaultRole: "customer",
        adminRoles: ["admin", "staff"],
        roles: {
          admin: adminAc,
          staff: adminAc,
          customer: userAc,
        },
      }),
    ],
  } satisfies BetterAuthOptions;

  return betterAuth({
    ...options,
    plugins: [
      ...options.plugins,
      customSession(async ({ user, session }) => {
        return {
          user: {
            ...user,
            role: user.role ?? "customer",
            status: user.status ?? "active",
            banned: user.banned ?? false,
            permissions: getPermissionsForRole(user.role),
          },
          session,
        };
      }, options),
    ],
  });
}

export const auth = createAuth();
export * from "./jwt";
export * from "./origins";
export * from "./permissions";
