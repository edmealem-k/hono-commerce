import { createDb } from "@hono-commerce/db";
import * as authSchema from "@hono-commerce/db/schema/auth";
import { env } from "@hono-commerce/env/api";
import { enqueueEmail } from "@hono-commerce/queue";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, magicLink } from "better-auth/plugins";

export function createAuth() {
  const db = createDb();

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
        sameSite: "none",
        secure: true,
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
      }),
    ],
  });
}

export const auth = createAuth();
export * from "./jwt";
export * from "./permissions";
