import { z } from "zod";

import { MERCHANT_ROLES } from "../domain/auth";

export const resolveInvitationQuerySchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});
export type ResolveInvitationQuery = z.infer<
  typeof resolveInvitationQuerySchema
>;

export const updateInvitationStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
  token: z.string().min(1, "Invitation token is required"),
});
export type UpdateInvitationStatusInput = z.infer<
  typeof updateInvitationStatusSchema
>;

export const createInvitationSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(MERCHANT_ROLES).default("member"),
});
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export const invitationParamSchema = z.object({
  invitationId: z.string().min(1, "Invitation ID is required"),
});
export type InvitationParam = z.infer<typeof invitationParamSchema>;

export const tenantParamSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
});
export type TenantParam = z.infer<typeof tenantParamSchema>;

export const cancelInvitationParamSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
  invitationId: z.string().min(1, "Invitation ID is required"),
});
export type CancelInvitationParam = z.infer<typeof cancelInvitationParamSchema>;
