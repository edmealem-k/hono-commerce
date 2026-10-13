import { verifyJwt } from "@hono-commerce/auth";
import { db } from "@hono-commerce/db";
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

    const invitationRecord = await db.query.tenantInvitation.findFirst({
      where: (table, { eq }) => eq(table.id, invitationId),
      with: {
        tenant: {
          columns: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            status: true,
          },
        },
        inviter: {
          columns: { id: true, name: true, email: true, image: true },
        },
      },
    });

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

    return c.json(
      ok({
        data: {
          id: invitationRecord.id,
          email: invitationRecord.email,
          role: invitationRecord.role,
          status: invitationRecord.status,
          createdAt: invitationRecord.createdAt,
          tenant: invitationRecord.tenant ?? {
            id: invitationRecord.tenantId,
            name: "Store",
            slug: "store",
            logo: null,
            status: "active",
          },
          inviter: invitationRecord.inviter ?? {
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
