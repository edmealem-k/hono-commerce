import { render } from "@react-email/render";
import * as React from "react";

import { InvitationEmail } from "./invitation";
import { MagicLinkEmail } from "./magic-link";
import { OrderConfirmationEmail } from "./order-confirmation";
import { SystemAlertEmail } from "./system-alert";

import type {
  EmailTemplate,
  EmailTemplatePropsMap,
} from "@hono-commerce/queue";

export * from "./magic-link";
export * from "./invitation";
export * from "./order-confirmation";
export * from "./system-alert";
export * from "./components";

// Registry mapping every EmailTemplate to its corresponding React Email component
const EMAIL_TEMPLATE_REGISTRY: {
  [K in EmailTemplate]: React.ComponentType<EmailTemplatePropsMap[K]>;
} = {
  "magic-link": MagicLinkEmail,
  "tenant-invitation": InvitationEmail,
  "order-confirmation": OrderConfirmationEmail,
  "system-alert": SystemAlertEmail,
};

export async function renderEmailTemplate<T extends EmailTemplate>(
  template: T,
  props: EmailTemplatePropsMap[T],
): Promise<{ html: string; text: string }> {
  const Component = EMAIL_TEMPLATE_REGISTRY[template] as React.ComponentType<
    EmailTemplatePropsMap[T]
  >;

  if (!Component) {
    throw new Error(`Unsupported email template: ${String(template)}`);
  }

  const element = React.createElement(Component, props);

  // Render HTML and plaintext concurrently for 2x throughput
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  return { html, text };
}
