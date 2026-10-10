import { and, db, eq } from "@hono-commerce/db";
import { tenantInvitation } from "@hono-commerce/db/schema/tenant";
import { cancelInvitationParamSchema } from "@hono-commerce/types";
import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const cancelInvitationHandler = factory.createHandlers(
  zValidator("param", cancelInvitationParamSchema),
  async (c) => {
    const { invitationId } = c.req.valid("param");
    const tenantContext = c.get("tenant");

    const [existing] = await db
      .select()
      .from(tenantInvitation)
      .where(
        and(
          eq(tenantInvitation.id, invitationId),
          eq(tenantInvitation.tenantId, tenantContext.tenantId),
        ),
      )
      .limit(1);

    if (!existing) {
      return c.json(
        {
          error: "Invitation not found",
          code: "NOT_FOUND",
        },
        404,
      );
    }

    if (existing.status !== "pending") {
      return c.json(
        {
          error: `Cannot cancel invitation with status '${existing.status}'`,
          code: "INVALID_STATUS",
        },
        409,
      );
    }

    const [updated] = await db
      .update(tenantInvitation)
      .set({
        status: "canceled",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tenantInvitation.id, invitationId),
          eq(tenantInvitation.tenantId, tenantContext.tenantId),
        ),
      )
      .returning();

    if (!updated) {
      return c.json(
        {
          error: "Failed to cancel invitation",
          code: "UPDATE_FAILED",
        },
        500,
      );
    }

    return c.json(
      {
        data: {
          id: updated.id,
          status: updated.status,
        },
      },
      200,
    );
  },
);
