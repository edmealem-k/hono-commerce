import { Heading, Text } from "@react-email/components";

import { EmailButton, EmailLayout, emailStyles } from "./components";

import type { SystemAlertEmailProps } from "@hono-commerce/queue";

export type { SystemAlertEmailProps };

export function SystemAlertEmail({
  title,
  message,
  actionUrl,
}: SystemAlertEmailProps) {
  return (
    <EmailLayout
      preview={`Alert: ${title}`}
      actionUrl={actionUrl}
      footerDisclaimer="This is an automated system notification from Hono Commerce."
    >
      <Heading style={emailStyles.title}>{title}</Heading>
      <Text style={emailStyles.paragraph}>{message}</Text>
      {actionUrl ? (
        <EmailButton href={actionUrl}>Open Dashboard</EmailButton>
      ) : null}
    </EmailLayout>
  );
}

export default SystemAlertEmail;
