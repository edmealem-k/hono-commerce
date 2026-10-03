import { Heading, Section, Text } from "@react-email/components";

import {
  EmailButton,
  EmailLayout,
  emailStyles,
  emailTokens,
} from "./components";

import type { InvitationEmailProps } from "@hono-commerce/queue";
import type * as React from "react";

export type { InvitationEmailProps };

export function InvitationEmail({
  inviterName,
  storeName,
  role,
  actionUrl,
  expiresInDays = 7,
}: InvitationEmailProps) {
  const inviterText = inviterName
    ? `${inviterName} has invited you`
    : "You have been invited";

  return (
    <EmailLayout
      preview={`Join ${storeName} on Hono Commerce`}
      brandName={storeName}
      actionUrl={actionUrl}
      footerDisclaimer="If you did not expect this invitation, you can safely ignore this email."
    >
      <Heading style={emailStyles.title}>Workspace Invitation</Heading>
      <Text style={emailStyles.paragraph}>
        {inviterText} to join <strong>{storeName}</strong> as a{" "}
        <strong>{role}</strong>.
      </Text>
      <Section style={detailsCard}>
        <Text style={detailsItem}>
          <span style={label}>Store:</span> {storeName}
        </Text>
        <Text style={detailsItem}>
          <span style={label}>Assigned Role:</span> {role}
        </Text>
        <Text style={detailsItem}>
          <span style={label}>Expires In:</span> {expiresInDays} days
        </Text>
      </Section>
      <EmailButton href={actionUrl}>Accept Invitation</EmailButton>
    </EmailLayout>
  );
}

export default InvitationEmail;

const detailsCard: React.CSSProperties = {
  backgroundColor: emailTokens.colors.codeBackground,
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const detailsItem: React.CSSProperties = {
  fontSize: "14px",
  color: emailTokens.colors.textSubtle,
  margin: "6px 0",
};

const label: React.CSSProperties = {
  color: emailTokens.colors.textSecondary,
  fontWeight: "500",
};
