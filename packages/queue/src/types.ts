export const QueueName = {
  EMAILS: "emails",
  STRIPE_WEBHOOKS: "stripe-webhooks",
  TENANT_WEBHOOKS: "tenant-webhooks",
  ORDERS: "orders",
} as const;

export type QueueNameType = (typeof QueueName)[keyof typeof QueueName];

export interface EnqueueEmailOptions {
  jobId?: string;
  delay?: number;
  priority?: number;
}

// Re-export all domain job types & schemas
export * from "./jobs/email";
