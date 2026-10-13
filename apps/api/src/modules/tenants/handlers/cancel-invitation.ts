import { and, db, eq } from "@hono-commerce/db";
import { tenantInvitation } from "@hono-commerce/db/schema/tenant";
import { cancelInvitationParamSchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const cancelInvitationHandler = factory.createHandlers(
  validated("param", cancelInvitationParamSchema),
  async (c) => {
    const { invitationId } = c.req.valid("param");
    const tenantContext = c.get("tenant");

    const existing = await db.query.tenantInvitation.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, invitationId),
          eq(table.tenantId, tenantContext.tenantId),
        ),
    });

    if (!existing) {
      return c.json(
        fail({
          error: "Invitation not found",
          code: "NOT_FOUND",
        }),
        404,
      );
    }

    if (existing.status !== "pending") {
      return c.json(
        fail({
          error: `Cannot cancel invitation with status '${existing.status}'`,
          code: "INVALID_STATUS",
        }),
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
        fail({
          error: "Failed to cancel invitation",
          code: "UPDATE_FAILED",
        }),
        500,
      );
    }

    return c.json(
      ok({
        data: {
          id: updated.id,
          status: updated.status,
        },
        message: "Invitation canceled successfully",
      }),
      200,
    );
  },
);
