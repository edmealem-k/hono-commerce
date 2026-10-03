import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from "@react-email/components";

import { EmailFooter } from "./footer";
import { EmailHeader } from "./header";
import { emailStyles } from "./styles";

import type * as React from "react";

export interface EmailLayoutProps {
  preview: string;
  brandName?: string;
  footerDisclaimer?: string;
  actionUrl?: string;
  fallbackUrl?: string;
  copyright?: string;
  children: React.ReactNode;
}

export function EmailLayout({
  preview,
  brandName,
  footerDisclaimer,
  actionUrl,
  fallbackUrl,
  copyright,
  children,
}: EmailLayoutProps) {
  const resolvedActionUrl = actionUrl ?? fallbackUrl;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <EmailHeader brandName={brandName} />
          <Section style={emailStyles.card}>
            {children}
            <EmailFooter
              footerDisclaimer={footerDisclaimer}
              actionUrl={resolvedActionUrl}
              copyright={copyright}
            />
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
