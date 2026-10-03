import { Button, Section } from "@react-email/components";

import { emailStyles } from "./styles";

import type * as React from "react";

export interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function EmailButton({ href, children, style }: EmailButtonProps) {
  return (
    <Section style={emailStyles.buttonContainer}>
      <Button style={{ ...emailStyles.button, ...style }} href={href}>
        {children}
      </Button>
    </Section>
  );
}
