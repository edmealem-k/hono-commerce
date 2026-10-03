import type * as React from "react";

export const emailTokens = {
  colors: {
    background: "#09090b",
    card: "#18181b",
    cardBorder: "#27272a",
    divider: "#27272a",
    primary: "#4f46e5",
    primaryText: "#ffffff",
    textPrimary: "#ffffff",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    textSubtle: "#e4e4e7",
    link: "#818cf8",
    codeBackground: "#27272a",
  },
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
} as const;

export const emailStyles: Record<string, React.CSSProperties> = {
  main: {
    backgroundColor: emailTokens.colors.background,
    fontFamily: emailTokens.fonts.sans,
    color: emailTokens.colors.textPrimary,
    padding: "40px 0",
  },
  container: {
    margin: "0 auto",
    maxWidth: "560px",
    padding: "0 20px",
  },
  card: {
    backgroundColor: emailTokens.colors.card,
    border: `1px solid ${emailTokens.colors.cardBorder}`,
    borderRadius: "16px",
    padding: "36px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    color: emailTokens.colors.textPrimary,
    margin: "0 0 16px",
    letterSpacing: "-0.3px",
  },
  paragraph: {
    fontSize: "14px",
    lineHeight: "22px",
    color: emailTokens.colors.textSecondary,
    margin: "0 0 24px",
  },
  divider: {
    borderColor: emailTokens.colors.divider,
    margin: "24px 0",
  },
  buttonContainer: {
    textAlign: "center",
    margin: "28px 0",
  },
  button: {
    backgroundColor: emailTokens.colors.primary,
    borderRadius: "8px",
    color: emailTokens.colors.primaryText,
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center",
    display: "inline-block",
    padding: "12px 28px",
  },
  link: {
    fontSize: "12px",
    color: emailTokens.colors.link,
    wordBreak: "break-all",
  },
  subtleText: {
    fontSize: "12px",
    color: emailTokens.colors.textMuted,
    margin: "0 0 8px",
  },
  footerNote: {
    fontSize: "13px",
    color: emailTokens.colors.textMuted,
    margin: "24px 0 0",
  },
};
