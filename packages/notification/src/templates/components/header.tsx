import { Heading, Section } from "@react-email/components";

import { emailTokens } from "./styles";

import type * as React from "react";

export interface EmailHeaderProps {
  brandName?: string;
}

export function EmailHeader({ brandName = "Hono Commerce" }: EmailHeaderProps) {
  return (
    <Section style={headerStyle}>
      <Heading style={logoStyle}>{brandName}</Heading>
    </Section>
  );
}

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "24px",
};

const logoStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "bold",
  color: emailTokens.colors.textPrimary,
  letterSpacing: "-0.5px",
  margin: "0",
};
