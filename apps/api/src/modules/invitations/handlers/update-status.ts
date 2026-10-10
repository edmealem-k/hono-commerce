import { auth, verifyJwt } from "@hono-commerce/auth";
import { and, db, eq } from "@hono-commerce/db";
import {
  tenantInvitation,
  tenantMember,
} from "@hono-commerce/db/schema/tenant";
import {
  invitationParamSchema,
  updateInvitationStatusSchema,
} from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

class InvitationApiError extends Error {
  readonly status: 400 | 404 | 409;
  readonly code: string;

  constructor(status: 400 | 404 | 409, message: string, code: string) {
    super(message);
    this.name = "InvitationApiError";
    this.status = status;
    this.code = code;
  }
}

const factory = createFactory();

export const updateInvitationStatusHandler = factory.createHandlers(
  validated("param", invitationParamSchema),
  validated("json", updateInvitationStatusSchema),
  async (c) => {
    const { invitationId } = c.req.valid("param");
    const { status, token } = c.req.valid("json");

    // 1. Verify cryptographic invitation token
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

    const inviteEmail = verifyResult.payload.email.toLowerCase().trim();

    // 2. Acceptance requires an authenticated, active session matching the invited email
    let authenticatedUserId: string | null = null;

    if (status === "accepted") {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session?.user) {
        return c.json(
          fail({
            error:
              "You must be signed in to accept this invitation. Please sign in or create an account with the invited email.",
            code: "AUTH_REQUIRED",
          }),
          401,
        );
      }

      const sessionUser = session.user;
      if (sessionUser.status !== "active" || sessionUser.banned) {
        return c.json(
          fail({
            error: "Your account is suspended or deactivated",
            code: "ACCOUNT_SUSPENDED",
          }),
          403,
        );
      }

      const sessionEmail = session.user.email.toLowerCase().trim();
      if (sessionEmail !== inviteEmail) {
        return c.json(
          fail({
            error: `You are signed in as ${sessionEmail}, but this invitation was sent to ${inviteEmail}. Please switch accounts.`,
            code: "EMAIL_MISMATCH",
          }),
          403,
        );
      }

      authenticatedUserId = session.user.id;
    }

    // 3. Execute atomic transaction (Review findings #3 & #9)
    try {
      const result = await db.transaction(async (tx) => {
        // Query invitation inside transaction
        const [invitationRecord] = await tx
          .select()
          .from(tenantInvitation)
          .where(eq(tenantInvitation.id, invitationId))
          .limit(1);

        if (!invitationRecord) {
          throw new InvitationApiError(
            404,
            "Invitation not found",
            "NOT_FOUND",
          );
        }

        if (invitationRecord.status !== "pending") {
          throw new InvitationApiError(
            409,
            `Invitation has already been ${invitationRecord.status}`,
            "INVITATION_ALREADY_RESOLVED",
          );
        }

        // Cross-check all token claims against database row
        if (
          invitationRecord.tenantId !== verifyResult.payload.tenantId ||
          invitationRecord.email.toLowerCase().trim() !== inviteEmail ||
          invitationRecord.role !== verifyResult.payload.role ||
          (invitationRecord.inviterId &&
            invitationRecord.inviterId !== verifyResult.payload.inviterId)
        ) {
          throw new InvitationApiError(
            400,
            "Invitation token claims do not match database record",
            "TOKEN_CLAIM_MISMATCH",
          );
        }

        // Update invitation status
        const [updatedInvitation] = await tx
          .update(tenantInvitation)
          .set({
            status,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(tenantInvitation.id, invitationId),
              eq(tenantInvitation.status, "pending"),
            ),
          )
          .returning();

        if (!updatedInvitation) {
          throw new InvitationApiError(
            409,
            "Conflict updating invitation state",
            "CONCURRENCY_CONFLICT",
          );
        }

        // If accepted, provision tenant membership in same transaction
        if (status === "accepted" && authenticatedUserId) {
          const [existingMember] = await tx
            .select()
            .from(tenantMember)
            .where(
              and(
                eq(tenantMember.tenantId, updatedInvitation.tenantId),
                eq(tenantMember.userId, authenticatedUserId),
              ),
            )
            .limit(1);

          if (existingMember) {
            await tx
              .update(tenantMember)
              .set({
                role: updatedInvitation.role,
                status: "active",
                updatedAt: new Date(),
              })
              .where(eq(tenantMember.id, existingMember.id));
          } else {
            await tx.insert(tenantMember).values({
              tenantId: updatedInvitation.tenantId,
              userId: authenticatedUserId,
              role: updatedInvitation.role,
              status: "active",
            });
          }
        }

        return updatedInvitation;
      });

      return c.json(
        ok({
          data: {
            id: result.id,
            status: result.status,
            role: result.role,
            tenantId: result.tenantId,
          },
          message:
            status === "accepted"
              ? "Invitation accepted successfully"
              : "Invitation declined successfully",
        }),
        200,
      );
    } catch (err) {
      if (err instanceof InvitationApiError) {
        return c.json(
          fail({
            error: err.message,
            code: err.code,
          }),
          err.status,
        );
      }

      console.error("[updateInvitationStatusHandler] Transaction error:", err);
      return c.json(
        fail({
          error: "An unexpected error occurred while resolving invitation",
          code: "INTERNAL_ERROR",
        }),
        500,
      );
    }
  },
);
