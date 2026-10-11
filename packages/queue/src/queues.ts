import { Queue } from "bullmq";

import { getRedisConnection } from "./connection";
import {
  type EmailJobData,
  type NotificationJobData,
  type StorageCleanupJobData,
  QueueName,
} from "./types";

let emailQueue: Queue<EmailJobData> | null = null;
let notificationQueue: Queue<NotificationJobData> | null = null;
let storageCleanupQueue: Queue<StorageCleanupJobData> | null = null;

export function getEmailQueue(): Queue<EmailJobData> {
  if (emailQueue) {
    return emailQueue;
  }

  emailQueue = new Queue<EmailJobData>(QueueName.EMAILS, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 86400, // keep for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 604800, // keep for 7 days
      },
    },
  });

  return emailQueue;
}

export function getStorageCleanupQueue(): Queue<StorageCleanupJobData> {
  if (storageCleanupQueue) {
    return storageCleanupQueue;
  }

  storageCleanupQueue = new Queue<StorageCleanupJobData>(
    QueueName.STORAGE_CLEANUP,
    {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800 },
      },
    },
  );

  return storageCleanupQueue;
}

export function getNotificationQueue(): Queue<NotificationJobData> {
  if (notificationQueue) {
    return notificationQueue;
  }

  notificationQueue = new Queue<NotificationJobData>(QueueName.NOTIFICATIONS, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 86400,
        count: 1000,
      },
      removeOnFail: {
        age: 604800,
      },
    },
  });

  return notificationQueue;
}
