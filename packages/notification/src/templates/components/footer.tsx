import { Hr, Link, Section, Text } from "@react-email/components";

import { emailStyles, emailTokens } from "./styles";

import type * as React from "react";

export interface EmailFooterProps {
  footerDisclaimer?: string;
  actionUrl?: string;
  fallbackUrl?: string;
  copyright?: string;
}

export function EmailFooter({
  footerDisclaimer,
  actionUrl,
  fallbackUrl,
  copyright = "© 2026 Hono Commerce. All rights reserved.",
}: EmailFooterProps) {
  const targetUrl = actionUrl || fallbackUrl;
  const hasDisclaimer = Boolean(footerDisclaimer);

  return (
    <Section>
      {hasDisclaimer ? (
        <Text style={emailStyles.footerNote}>{footerDisclaimer}</Text>
      ) : null}

      {targetUrl ? (
        <>
          <Hr style={emailStyles.divider} />
          <Text style={emailStyles.subtleText}>
            Having trouble with the button? Copy and paste this URL into your
            browser:
          </Text>
          <Link href={targetUrl} style={emailStyles.link}>
            {targetUrl}
          </Link>
        </>
      ) : null}

      <Hr style={emailStyles.divider} />
      <Text style={copyrightStyle}>{copyright}</Text>
    </Section>
  );
}

const copyrightStyle: React.CSSProperties = {
  fontSize: "12px",
  color: emailTokens.colors.textMuted,
  textAlign: "center",
  margin: "12px 0 0",
};
