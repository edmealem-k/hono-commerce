import { tenantParamSchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const getWorkspaceHandler = factory.createHandlers(
  validated("param", tenantParamSchema),
  async (c) => {
    const tenantContext = c.get("tenant");

    return c.json(
      ok({
        data: {
          id: tenantContext.tenantId,
          name: tenantContext.tenantName,
          slug: tenantContext.tenantSlug,
          status: tenantContext.tenantStatus,
          role: tenantContext.role,
          memberStatus: tenantContext.memberStatus,
        },
      }),
      200,
    );
  },
);
