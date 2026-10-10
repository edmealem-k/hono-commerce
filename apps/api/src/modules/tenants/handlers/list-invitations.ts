import { db, desc, eq } from "@hono-commerce/db";
import { tenantInvitation } from "@hono-commerce/db/schema/tenant";
import { tenantParamSchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const listInvitationsHandler = factory.createHandlers(
  validated("param", tenantParamSchema),
  async (c) => {
    const tenantContext = c.get("tenant");

    const invitations = await db
      .select({
        id: tenantInvitation.id,
        email: tenantInvitation.email,
        role: tenantInvitation.role,
        status: tenantInvitation.status,
        inviterId: tenantInvitation.inviterId,
        createdAt: tenantInvitation.createdAt,
        updatedAt: tenantInvitation.updatedAt,
      })
      .from(tenantInvitation)
      .where(eq(tenantInvitation.tenantId, tenantContext.tenantId))
      .orderBy(desc(tenantInvitation.createdAt));

    return c.json(
      ok({
        data: invitations,
      }),
      200,
    );
  },
);
