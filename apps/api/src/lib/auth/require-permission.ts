import { hasPermission } from "@hono-commerce/auth/permissions";

import type { Context, Next } from "hono";

export function requirePermission(permission: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          error: "Authentication required before permission verification",
          code: "UNAUTHORIZED",
        },
        401,
      );
    }

    const tenantSlug = c.get("tenantSlug");
    const allowed = hasPermission(user, permission, {
      tenantId: tenantSlug,
    });

    if (!allowed) {
      return c.json(
        {
          error: `Forbidden: missing permission '${permission}'`,
          code: "FORBIDDEN",
        },
        403,
      );
    }

    await next();
  };
}
