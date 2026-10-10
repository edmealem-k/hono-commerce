import { hasPermission } from "@hono-commerce/auth/permissions";

import type { SessionUser, TenantContext } from "../../types/auth";
import type { Context, Next } from "hono";

export function requirePermission(permission: string) {
  return async (
    c: Context<{
      Variables: {
        user?: SessionUser;
        tenant?: TenantContext;
      };
    }>,
    next: Next,
  ) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          error: "Authentication required",
          code: "UNAUTHORIZED",
        },
        401,
      );
    }

    // Platform admin has full access
    if (user.role === "admin") {
      await next();
      return;
    }

    // If route has tenant context attached, evaluate merchant role
    const tenantContext = c.get("tenant");
    const evaluatedRole = tenantContext?.role || user.role;

    const allowed = hasPermission(
      {
        id: user.id,
        role: evaluatedRole,
        permissions: Array.isArray(user.permissions)
          ? user.permissions
          : undefined,
      },
      permission,
    );

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
