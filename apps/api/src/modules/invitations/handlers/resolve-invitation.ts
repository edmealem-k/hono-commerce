import { verifyJwt } from "@hono-commerce/auth";
import { db, eq } from "@hono-commerce/db";
import { user } from "@hono-commerce/db/schema/auth";
import { tenant, tenantInvitation } from "@hono-commerce/db/schema/tenant";
import {
  invitationParamSchema,
  resolveInvitationQuerySchema,
} from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

const factory = createFactory();

export const resolveInvitationHandler = factory.createHandlers(
  validated("param", invitationParamSchema),
  validated("query", resolveInvitationQuerySchema),
  async (c) => {
    const { invitationId } = c.req.valid("param");
    const { token } = c.req.valid("query");

    const verifyResult = await verifyJwt(token, "invitation");
    if (!verifyResult.success) {
      return c.json(
        fail({
          error: "Invalid or expired invitation token",
          code: verifyResult.error,
        }),
        400,
      );
    }

    if (verifyResult.payload.invitationId !== invitationId) {
      return c.json(
        fail({
          error: "Invitation token does not match the requested invitation",
          code: "TOKEN_MISMATCH",
        }),
        400,
      );
    }

    const [invitationRecord] = await db
      .select()
      .from(tenantInvitation)
      .where(eq(tenantInvitation.id, invitationId))
      .limit(1);

    if (!invitationRecord) {
      return c.json(
        fail({
          error: "Invitation not found",
          code: "NOT_FOUND",
        }),
        404,
      );
    }

    // Cross-check all token claims against database record
    if (
      invitationRecord.tenantId !== verifyResult.payload.tenantId ||
      invitationRecord.email.toLowerCase().trim() !==
        verifyResult.payload.email.toLowerCase().trim() ||
      invitationRecord.role !== verifyResult.payload.role ||
      (invitationRecord.inviterId &&
        invitationRecord.inviterId !== verifyResult.payload.inviterId)
    ) {
      return c.json(
        fail({
          error: "Invitation token claims do not match database record",
          code: "TOKEN_CLAIM_MISMATCH",
        }),
        400,
      );
    }

    if (invitationRecord.status !== "pending") {
      return c.json(
        fail({
          error: `Invitation has already been ${invitationRecord.status}`,
          code: "INVITATION_ALREADY_RESOLVED",
        }),
        409,
      );
    }

    const [tenantRecord] = await db
      .select({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        status: tenant.status,
      })
      .from(tenant)
      .where(eq(tenant.id, invitationRecord.tenantId))
      .limit(1);

    const [inviterRecord] = invitationRecord.inviterId
      ? await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          })
          .from(user)
          .where(eq(user.id, invitationRecord.inviterId))
          .limit(1)
      : [undefined];

    return c.json(
      ok({
        data: {
          id: invitationRecord.id,
          email: invitationRecord.email,
          role: invitationRecord.role,
          status: invitationRecord.status,
          createdAt: invitationRecord.createdAt,
          tenant: tenantRecord ?? {
            id: invitationRecord.tenantId,
            name: "Store",
            slug: "store",
            logo: null,
            status: "active",
          },
          inviter: inviterRecord ?? {
            id: invitationRecord.inviterId,
            name: "Team Member",
            email: "",
            image: null,
          },
        },
      }),
      200,
    );
  },
);
