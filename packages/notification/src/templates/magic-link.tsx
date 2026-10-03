import { Heading, Text } from "@react-email/components";

import {
  EmailButton,
  EmailCodeBox,
  EmailLayout,
  emailStyles,
} from "./components";

import type { MagicLinkEmailProps } from "@hono-commerce/queue";

export type { MagicLinkEmailProps };

export function MagicLinkEmail({
  actionUrl,
  token,
  expiresInMinutes = 10,
}: MagicLinkEmailProps) {
  return (
    <EmailLayout
      preview="Your secure sign-in link for Hono Commerce"
      actionUrl={actionUrl}
      footerDisclaimer="If you didn't request this email, you can safely ignore it."
    >
      <Heading style={emailStyles.title}>Sign In to Your Account</Heading>
      <Text style={emailStyles.paragraph}>
        Click the button below to sign in to your Hono Commerce store. This link
        is valid for {expiresInMinutes} minutes and can only be used once.
      </Text>
      <EmailButton href={actionUrl}>Sign In to Hono Commerce</EmailButton>
      {token ? <EmailCodeBox code={token} /> : null}
    </EmailLayout>
  );
}

export default MagicLinkEmail;
