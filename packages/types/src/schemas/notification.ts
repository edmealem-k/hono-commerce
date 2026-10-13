import { z } from "zod";

export const notificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const notificationParamSchema = z.object({
  notificationId: z.string().uuid(),
});

export const updateNotificationReadStateSchema = z.object({
  isRead: z.boolean(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
export type NotificationParam = z.infer<typeof notificationParamSchema>;
export type UpdateNotificationReadStateInput = z.infer<
  typeof updateNotificationReadStateSchema
>;
