import { db } from "@hono-commerce/db";
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

    const invitations = await db.query.tenantInvitation.findMany({
      columns: {
        id: true,
        email: true,
        role: true,
        status: true,
        inviterId: true,
        createdAt: true,
        updatedAt: true,
      },
      where: (table, { eq }) => eq(table.tenantId, tenantContext.tenantId),
      orderBy: (table, { desc }) => desc(table.createdAt),
    });

    return c.json(
      ok({
        data: invitations,
      }),
      200,
    );
  },
);
