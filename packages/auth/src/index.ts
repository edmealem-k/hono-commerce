import { createDb, eq } from "@hono-commerce/db";
import * as authSchema from "@hono-commerce/db/schema/auth";
import { env } from "@hono-commerce/env/api";
import { enqueueEmail } from "@hono-commerce/queue";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, customSession, magicLink } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

import { getPermissionsForRole } from "./permissions";

export function createAuth() {
  const db = createDb();
  const isProduction = env.NODE_ENV === "production";

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        ...authSchema,
      },
    }),
    trustedOrigins: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    emailAndPassword: {
      enabled: false,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "customer",
        },
        status: {
          type: "string",
          defaultValue: "active",
        },
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      generateId: () => crypto.randomUUID(),
      defaultCookieAttributes: {
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        httpOnly: true,
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
        roles: {
          admin: adminAc,
          staff: adminAc,
          customer: userAc,
        },
      }),
      customSession(async ({ user, session }) => {
        const [userRecord] = await db
          .select({
            role: authSchema.user.role,
            status: authSchema.user.status,
            banned: authSchema.user.banned,
          })
          .from(authSchema.user)
          .where(eq(authSchema.user.id, user.id))
          .limit(1);

        return {
          user: {
            ...user,
            role: userRecord?.role ?? "customer",
            status: userRecord?.status ?? "active",
            banned: userRecord?.banned ?? false,
            permissions: getPermissionsForRole(userRecord?.role),
          },
          session,
        };
      }),
    ],
  });
}

export const auth = createAuth();
export * from "./jwt";
export * from "./permissions";
