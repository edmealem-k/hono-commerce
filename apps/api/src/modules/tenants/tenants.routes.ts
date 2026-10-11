import { Hono } from "hono";

import { requireAuth } from "../../lib/auth/require-auth";
import { requirePermission } from "../../lib/auth/require-permission";
import { requireTenantContext } from "../../lib/auth/require-tenant";
import { cancelInvitationHandler } from "./handlers/cancel-invitation";
import { createInvitationHandler } from "./handlers/create-invitation";
import { listInvitationsHandler } from "./handlers/list-invitations";
import { resendInvitationHandler } from "./handlers/resend-invitation";

import type { TenantEnv } from "../../types/auth";

export const tenantsRouter = new Hono<TenantEnv>()
  .use("*", requireAuth())
  .use("/:tenantId/*", requireTenantContext())
  .post(
    "/:tenantId/invitations",
    requirePermission("TEAM:INVITE"),
    ...createInvitationHandler,
  )
  .get(
    "/:tenantId/invitations",
    requirePermission("TEAM:INVITE"),
    ...listInvitationsHandler,
  )
  .post(
    "/:tenantId/invitations/:invitationId/resend",
    requirePermission("TEAM:INVITE"),
    ...resendInvitationHandler,
  )
  .delete(
    "/:tenantId/invitations/:invitationId",
    requirePermission("TEAM:INVITE"),
    ...cancelInvitationHandler,
  );
