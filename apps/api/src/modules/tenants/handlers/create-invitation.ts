import { signJwt } from "@hono-commerce/auth";
import { db } from "@hono-commerce/db";
import { tenantInvitation } from "@hono-commerce/db/schema/tenant";
import { env } from "@hono-commerce/env/api";
import { enqueueEmail } from "@hono-commerce/queue";
import {
  createInvitationSchema,
  tenantParamSchema,
} from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const createInvitationHandler = factory.createHandlers(
  validated("param", tenantParamSchema),
  validated("json", createInvitationSchema),
  async (c) => {
    const { email, role } = c.req.valid("json");
    const caller = c.get("user");
    const tenantContext = c.get("tenant");

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === caller.email.toLowerCase().trim()) {
      return c.json(
        fail({
          error: "You cannot invite yourself",
          code: "SELF_INVITE",
        }),
        400,
      );
    }

    // 1. Check if user is already an active member of this store
    const existingUser = await db.query.user.findFirst({
      columns: { id: true },
      where: (table, { eq }) => eq(table.email, normalizedEmail),
    });

    if (existingUser) {
      const existingMember = await db.query.tenantMember.findFirst({
        columns: { id: true, status: true },
        where: (table, { and, eq }) =>
          and(
            eq(table.tenantId, tenantContext.tenantId),
            eq(table.userId, existingUser.id),
          ),
      });

      if (existingMember && existingMember.status === "active") {
        return c.json(
          fail({
            error: "User is already an active member of this store",
            code: "ALREADY_MEMBER",
          }),
          409,
        );
      }
    }

    // 2. Check if a pending invitation already exists for this email
    const existingPending = await db.query.tenantInvitation.findFirst({
      columns: { id: true },
      where: (table, { and, eq }) =>
        and(
          eq(table.tenantId, tenantContext.tenantId),
          eq(table.email, normalizedEmail),
          eq(table.status, "pending"),
        ),
    });

    if (existingPending) {
      return c.json(
        fail({
          error: "A pending invitation already exists for this email",
          code: "INVITATION_PENDING",
        }),
        409,
      );
    }

    // 3. Insert the invitation record
    const [invitation] = await db
      .insert(tenantInvitation)
      .values({
        tenantId: tenantContext.tenantId,
        email: normalizedEmail,
        role,
        inviterId: caller.id,
        status: "pending",
      })
      .returning();

    if (!invitation) {
      return c.json(
        fail({
          error: "Failed to create invitation",
          code: "CREATION_FAILED",
        }),
        500,
      );
    }

    // 4. Cryptographically sign the invitation token
    const token = await signJwt(
      {
        type: "invitation",
        invitationId: invitation.id,
        tenantId: tenantContext.tenantId,
        email: normalizedEmail,
        role: invitation.role,
        inviterId: caller.id,
      },
      { expiresIn: "7d" },
    );

    // 5. Enqueue email notification after DB write
    const dashboardUrl = env.DASHBOARD_URL || env.BETTER_AUTH_URL;
    const actionUrl = `${dashboardUrl}/invitations/${invitation.id}?token=${token}`;

    try {
      await enqueueEmail({
        to: normalizedEmail,
        subject: `You've been invited to join ${tenantContext.tenantName || tenantContext.tenantSlug}`,
        tenantId: tenantContext.tenantId,
        template: "tenant-invitation",
        props: {
          actionUrl,
          inviterName: caller.name || caller.email,
          storeName: tenantContext.tenantName || tenantContext.tenantSlug,
          role: invitation.role,
          expiresInDays: 7,
        },
      });
    } catch (err) {
      console.error(
        "[createInvitation] Failed to enqueue invitation email:",
        err,
      );
    }

    return c.json(
      ok({
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          createdAt: invitation.createdAt,
        },
        message: "Invitation sent successfully",
      }),
      201,
    );
  },
);
