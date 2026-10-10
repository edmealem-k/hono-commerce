import { enqueueNotificationFanout } from "@hono-commerce/queue";

import { sendEmailNotification } from "./channels/email";
import { sendInAppNotification } from "./channels/in-app";
import { sendPushNotification } from "./channels/push";

import type {
  NotificationChannelOptions,
  SystemNotificationPayload,
  SystemNotificationType,
  TenantNotificationPayload,
  TenantNotificationType,
  UserNotificationPayload,
  UserNotificationType,
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
        userId: payload.userId,
        type: _type,
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
  const idempotencyKey =
    payload.idempotencyKey ||
    channelOptions?.idempotencyKey ||
    crypto.randomUUID();

  if (channels.inApp || channels.email) {
    promises.push(
      enqueueNotificationFanout(
        {
          jobType: "tenant-notifications-fanout",
          tenantId: payload.tenantId,
          type: _type,
          targetRoles: payload.targetRoles,
          title: payload.data.title,
          message: payload.data.message,
          actionUrl: payload.data.actionUrl,
          metadata: payload.data.metadata,
          idempotencyKey,
          channels: {
            inApp: channels.inApp,
            email: channels.email,
          },
        },
        { jobId: idempotencyKey },
      )
        .then(() => true)
        .catch((err) => {
          console.error(
            "[Notification] Failed to enqueue tenant fanout job:",
            err,
          );
          return false;
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

export async function notifySystem(
  _type: SystemNotificationType,
  payload: SystemNotificationPayload,
  channelOptions?: NotificationChannelOptions,
): Promise<{ success: boolean; results: PromiseSettledResult<boolean>[] }> {
  const channels = {
    inApp: true,
    email: false,
    sms: false,
    ...channelOptions,
  };
  const promises: Promise<boolean>[] = [];
  const idempotencyKey =
    payload.idempotencyKey ||
    channelOptions?.idempotencyKey ||
    crypto.randomUUID();

  if (channels.inApp || channels.email) {
    promises.push(
      enqueueNotificationFanout(
        {
          jobType: "system-notifications-fanout",
          type: _type,
          systemRoles: payload.systemRoles as (
            | "admin"
            | "staff"
            | "customer"
          )[],
          title: payload.data.title,
          message: payload.data.message,
          actionUrl: payload.data.actionUrl,
          metadata: payload.data.metadata,
          idempotencyKey,
          channels: {
            inApp: channels.inApp,
            email: channels.email,
          },
        },
        { jobId: idempotencyKey },
      )
        .then(() => true)
        .catch((err) => {
          console.error(
            "[Notification] Failed to enqueue system fanout job:",
            err,
          );
          return false;
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
