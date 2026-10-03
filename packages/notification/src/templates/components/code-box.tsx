import { Section, Text } from "@react-email/components";

import { emailTokens } from "./styles";

import type * as React from "react";

export interface EmailCodeBoxProps {
  code: string;
  label?: string;
}

export function EmailCodeBox({
  code,
  label = "Or enter this verification code:",
}: EmailCodeBoxProps) {
  return (
    <Section style={codeBoxStyle}>
      <Text style={codeLabelStyle}>{label}</Text>
      <Text style={codeTextStyle}>{code}</Text>
    </Section>
  );
}

const codeBoxStyle: React.CSSProperties = {
  backgroundColor: emailTokens.colors.codeBackground,
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center",
  margin: "24px 0",
};

const codeLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: emailTokens.colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: "1px",
  margin: "0 0 8px",
};

const codeTextStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: emailTokens.colors.textPrimary,
  letterSpacing: "4px",
  fontFamily: emailTokens.fonts.mono,
  margin: "0",
};
