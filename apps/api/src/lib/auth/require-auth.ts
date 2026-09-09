import { auth } from "@hono-commerce/auth";

import type { Context, Next } from "hono";

export function requireAuth() {
  return async (c: Context, next: Next) => {
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session?.user) {
        return c.json(
          {
            error: "Authentication required",
            code: "UNAUTHORIZED",
          },
          401,
        );
      }

      c.set("user", session.user);
      c.set("session", session.session);
      await next();
    } catch (error) {
      console.error("[requireAuth] Error verifying session:", error);
      return c.json(
        {
          error: "Invalid or expired session",
          code: "UNAUTHORIZED",
        },
        401,
      );
    }
  };
}
