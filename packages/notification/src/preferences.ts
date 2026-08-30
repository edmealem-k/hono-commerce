import type { NotificationChannel, AllNotificationTypes } from "./types";

export interface RecipientPreference {
  userId: string;
  enabledChannels: NotificationChannel[];
  mutedNotificationTypes: AllNotificationTypes[];
}

export function shouldDeliverNotification({
  channel,
  notificationType,
  preference,
  defaultEnabled = true,
}: {
  channel: NotificationChannel;
  notificationType: AllNotificationTypes;
  preference?: RecipientPreference | null;
  defaultEnabled?: boolean;
}): boolean {
  if (!preference) return defaultEnabled;

  if (preference.mutedNotificationTypes?.includes(notificationType)) {
    return false;
  }

  return preference.enabledChannels?.includes(channel) ?? defaultEnabled;
}
