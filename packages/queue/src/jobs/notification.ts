import { MERCHANT_ROLES, PLATFORM_ROLES } from "@hono-commerce/types";
import { z } from "zod";

export const MerchantRoleSchema = z.enum(MERCHANT_ROLES);
export const PlatformRoleSchema = z.enum(PLATFORM_ROLES);

export const BaseNotificationJobSchema = z.object({
  tenantId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});
export type BaseNotificationJob = z.infer<typeof BaseNotificationJobSchema>;

export const TenantNotificationFanoutPayloadSchema = z.object({
  jobType: z.literal("tenant-notifications-fanout"),
  tenantId: z.string().min(1),
  type: z.string().min(1),
  targetRoles: z.array(MerchantRoleSchema).optional(),
  title: z.string().min(1),
  message: z.string().min(1),
  actionUrl: z.string().optional(),
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    )
    .optional(),
  channels: z
    .object({
      inApp: z.boolean().optional(),
      email: z.boolean().optional(),
    })
    .optional(),
});
export type TenantNotificationFanoutPayload = z.infer<
  typeof TenantNotificationFanoutPayloadSchema
>;

export const SystemNotificationFanoutPayloadSchema = z.object({
  jobType: z.literal("system-notifications-fanout"),
  type: z.string().min(1),
  systemRoles: z.array(PlatformRoleSchema).optional(),
  title: z.string().min(1),
  message: z.string().min(1),
  actionUrl: z.string().optional(),
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    )
    .optional(),
  channels: z
    .object({
      inApp: z.boolean().optional(),
      email: z.boolean().optional(),
    })
    .optional(),
});
export type SystemNotificationFanoutPayload = z.infer<
  typeof SystemNotificationFanoutPayloadSchema
>;

export const NotificationFanoutPayloadSchema = z.discriminatedUnion("jobType", [
  TenantNotificationFanoutPayloadSchema,
  SystemNotificationFanoutPayloadSchema,
]);
export type NotificationFanoutPayload = z.infer<
  typeof NotificationFanoutPayloadSchema
>;

export const NotificationJobSchema = BaseNotificationJobSchema.and(
  NotificationFanoutPayloadSchema,
);
export type NotificationJobData = z.infer<typeof NotificationJobSchema>;
