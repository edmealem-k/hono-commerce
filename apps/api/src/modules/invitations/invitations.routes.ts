import { Hono } from "hono";

import { resolveInvitationHandler } from "./handlers/resolve-invitation";
import { updateInvitationStatusHandler } from "./handlers/update-status";

export const invitationsRouter = new Hono()
  .get("/:invitationId", ...resolveInvitationHandler)
  .patch("/:invitationId", ...updateInvitationStatusHandler);
