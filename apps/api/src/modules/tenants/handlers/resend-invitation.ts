import { signJwt } from "@hono-commerce/auth";
import { db } from "@hono-commerce/db";
import { env } from "@hono-commerce/env/api";
import { enqueueEmail } from "@hono-commerce/queue";
import { cancelInvitationParamSchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const resendInvitationHandler = factory.createHandlers(
  validated("param", cancelInvitationParamSchema),
  async (c) => {
    const { invitationId } = c.req.valid("param");
    const caller = c.get("user");
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
          error: `Cannot resend invitation with status '${existing.status}'`,
          code: "INVALID_STATUS",
        }),
        409,
      );
    }

    // Sign fresh token
    const token = await signJwt(
      {
        type: "invitation",
        invitationId: existing.id,
        tenantId: tenantContext.tenantId,
        email: existing.email,
        role: existing.role,
        inviterId: caller.id,
      },
      { expiresIn: "7d" },
    );

    // Enqueue email
    const dashboardUrl = env.DASHBOARD_URL || env.BETTER_AUTH_URL;
    const actionUrl = `${dashboardUrl}/invitations/${existing.id}?token=${token}`;

    try {
      await enqueueEmail({
        to: existing.email,
        subject: `You've been invited to join ${tenantContext.tenantName || tenantContext.tenantSlug}`,
        tenantId: tenantContext.tenantId,
        template: "tenant-invitation",
        props: {
          actionUrl,
          inviterName: caller.name || caller.email,
          storeName: tenantContext.tenantName || tenantContext.tenantSlug,
          role: existing.role,
          expiresInDays: 7,
        },
      });
    } catch (err) {
      console.error(
        "[resendInvitation] Failed to enqueue invitation email:",
        err,
      );
    }

    return c.json(
      ok({
        message: "Invitation resent successfully",
      }),
      200,
    );
  },
);
