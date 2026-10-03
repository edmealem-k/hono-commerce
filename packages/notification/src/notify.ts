import { sendEmailNotification } from "./channels/email";
import { sendInAppNotification } from "./channels/in-app";
import { sendPushNotification } from "./channels/push";

import type {
  UserNotificationType,
  TenantNotificationType,
  SystemNotificationType,
  UserNotificationPayload,
  TenantNotificationPayload,
  SystemNotificationPayload,
  NotificationChannelOptions,
} from "./types";

const DEFAULT_CHANNELS: NotificationChannelOptions = {
  inApp: true,
  email: true,
  push: false,
  sms: false,
};

export async function notifyUser(
  _type: UserNotificationType,
  payload: UserNotificationPayload,
  channelOptions?: NotificationChannelOptions,
): Promise<{ success: boolean; results: PromiseSettledResult<boolean>[] }> {
  const channels = { ...DEFAULT_CHANNELS, ...channelOptions };
  const promises: Promise<boolean>[] = [];

  if (channels.inApp) {
    promises.push(
      sendInAppNotification({
        recipientId: payload.userId,
        data: payload.data,
      }),
    );
  }

  if (channels.email && payload.email) {
    promises.push(
      sendEmailNotification({
        to: payload.email,
        subject: payload.data.title,
        data: payload.data,
      }),
    );
  }

  if (channels.push) {
    promises.push(
      sendPushNotification({
        recipientId: payload.userId,
        data: payload.data,
      }),
    );
  }

  const results = await Promise.allSettled(promises);
  const anySuccessful = results.some(
    (r) => r.status === "fulfilled" && r.value === true,
  );

  return {
    success: anySuccessful,
    results,
  };
}

export async function notifyTenant(
  _type: TenantNotificationType,
  payload: TenantNotificationPayload,
  channelOptions?: NotificationChannelOptions,
): Promise<{ success: boolean; results: PromiseSettledResult<boolean>[] }> {
  const channels = { ...DEFAULT_CHANNELS, ...channelOptions };
  const promises: Promise<boolean>[] = [];

  if (channels.inApp) {
    promises.push(
      sendInAppNotification({
        recipientId: `tenant:${payload.tenantId}`,
        data: payload.data,
      }),
    );
  }

  // TODO(auth-schema): Once tenant_member DB schema is implemented:
  // If channels.email or channels.push is requested, enqueue a tenant-notifications-fanout
  // job in apps/worker to query members matching payload.targetRoles and dispatch per-user.

  const results = await Promise.allSettled(promises);
  const anySuccessful = results.some(
    (r) => r.status === "fulfilled" && r.value === true,
  );

  return {
    success: anySuccessful,
    results,
  };
}

export async function notifySystem(
  _type: SystemNotificationType,
  payload: SystemNotificationPayload,
  channelOptions?: NotificationChannelOptions,
): Promise<{ success: boolean; results: PromiseSettledResult<boolean>[] }> {
  const channels = {
    inApp: true,
    email: false,
    push: false,
    sms: false,
    ...channelOptions,
  };
  const promises: Promise<boolean>[] = [];

  if (channels.inApp) {
    promises.push(
      sendInAppNotification({
        recipientId: "system:admin",
        data: payload.data,
      }),
    );
  }

  // TODO(auth-schema): Once platform user roles DB schema is implemented:
  // If channels.email or channels.push is requested, enqueue a system-notifications-fanout
  // job in apps/worker to query platform users matching payload.systemRoles and dispatch per-user.

  const results = await Promise.allSettled(promises);
  const anySuccessful = results.some(
    (r) => r.status === "fulfilled" && r.value === true,
  );

  return {
    success: anySuccessful,
    results,
  };
}
