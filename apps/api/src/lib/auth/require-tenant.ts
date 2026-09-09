import { extractTenantSlugFromHeaders } from "../tenant/tenant-context";

import type { Context, Next } from "hono";

export function requireTenantContext() {
  return async (c: Context, next: Next) => {
    const tenantSlug = extractTenantSlugFromHeaders(c.req.raw.headers);

    if (!tenantSlug) {
      return c.json(
        {
          error: "Store/Tenant context is required for this endpoint",
          code: "TENANT_REQUIRED",
        },
        400,
      );
    }

    c.set("tenantSlug", tenantSlug);
    await next();
  };
}
