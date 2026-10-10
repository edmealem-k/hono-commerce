import { Queue } from "bullmq";

import { getRedisConnection } from "./connection";
import {
  type EmailJobData,
  type NotificationJobData,
  QueueName,
} from "./types";

let emailQueue: Queue<EmailJobData> | null = null;
let notificationQueue: Queue<NotificationJobData> | null = null;

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
