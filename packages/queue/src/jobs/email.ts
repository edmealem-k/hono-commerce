import { z } from "zod";

export const EmailTemplateSchema = z.enum([
  "magic-link",
  "tenant-invitation",
  "order-confirmation",
  "system-alert",
]);
export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

// Base Notification / Email Contract
export interface BaseEmailProps {
  actionUrl?: string;
}

// Template Props Schemas & Interfaces
export const MagicLinkEmailPropsSchema = z.object({
  actionUrl: z.string().min(1),
  token: z.string().optional(),
  expiresInMinutes: z.number().int().positive().optional(),
});
export type MagicLinkEmailProps = z.infer<typeof MagicLinkEmailPropsSchema>;

export const InvitationEmailPropsSchema = z.object({
  actionUrl: z.string().min(1),
  inviterName: z.string().optional(),
  storeName: z.string().min(1),
  role: z.string().min(1),
  expiresInDays: z.number().int().positive().optional(),
});
export type InvitationEmailProps = z.infer<typeof InvitationEmailPropsSchema>;

export const OrderItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  priceInCents: z.number().int().nonnegative(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderConfirmationEmailPropsSchema = z.object({
  actionUrl: z.string().min(1).optional(),
  orderNumber: z.string().min(1),
  totalInCents: z.number().int().nonnegative(),
  currency: z.string().optional(),
  items: z.array(OrderItemSchema),
});
export type OrderConfirmationEmailProps = z.infer<
  typeof OrderConfirmationEmailPropsSchema
>;

export const SystemAlertEmailPropsSchema = z.object({
  actionUrl: z.string().min(1).optional(),
  title: z.string().min(1),
  message: z.string().min(1),
});
export type SystemAlertEmailProps = z.infer<typeof SystemAlertEmailPropsSchema>;

// Strongly-typed mapping between template name and its props
export type EmailTemplatePropsMap = {
  "magic-link": MagicLinkEmailProps;
  "tenant-invitation": InvitationEmailProps;
  "order-confirmation": OrderConfirmationEmailProps;
  "system-alert": SystemAlertEmailProps;
};

// Base schema for common job envelope fields
export const BaseEmailJobSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  tenantId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});
export type BaseEmailJob = z.infer<typeof BaseEmailJobSchema>;

// Discriminated union for template-specific payload
export const EmailPayloadSchema = z.discriminatedUnion("template", [
  z.object({
    template: z.literal("magic-link"),
    props: MagicLinkEmailPropsSchema,
  }),
  z.object({
    template: z.literal("tenant-invitation"),
    props: InvitationEmailPropsSchema,
  }),
  z.object({
    template: z.literal("order-confirmation"),
    props: OrderConfirmationEmailPropsSchema,
  }),
  z.object({
    template: z.literal("system-alert"),
    props: SystemAlertEmailPropsSchema,
  }),
]);
export type EmailPayload = z.infer<typeof EmailPayloadSchema>;

// Composed runtime Zod schema for email job validation
export const EmailJobSchema = BaseEmailJobSchema.and(EmailPayloadSchema);

// Envelope types for each domain template
export type MagicLinkEmailJob = BaseEmailJob & {
  template: "magic-link";
  props: MagicLinkEmailProps;
};

export type InvitationEmailJob = BaseEmailJob & {
  template: "tenant-invitation";
  props: InvitationEmailProps;
};

export type OrderConfirmationEmailJob = BaseEmailJob & {
  template: "order-confirmation";
  props: OrderConfirmationEmailProps;
};

export type SystemAlertEmailJob = BaseEmailJob & {
  template: "system-alert";
  props: SystemAlertEmailProps;
};

export type EmailJobDataMap = {
  "magic-link": MagicLinkEmailJob;
  "tenant-invitation": InvitationEmailJob;
  "order-confirmation": OrderConfirmationEmailJob;
  "system-alert": SystemAlertEmailJob;
};

// Discriminated union for job data
export type EmailJobData<T extends EmailTemplate = EmailTemplate> =
  EmailJobDataMap[T];
