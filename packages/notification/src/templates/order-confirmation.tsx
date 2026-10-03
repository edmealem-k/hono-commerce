import { Heading, Hr, Section, Text } from "@react-email/components";

import {
  EmailButton,
  EmailLayout,
  emailStyles,
  emailTokens,
} from "./components";

import type {
  OrderConfirmationEmailProps,
  OrderItem,
} from "@hono-commerce/queue";
import type * as React from "react";

export type { OrderConfirmationEmailProps, OrderItem };

const formatters = new Map<string, Intl.NumberFormat>();

function formatMoney(cents: number, currency = "USD") {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(cents / 100);
}

export function OrderConfirmationEmail({
  orderNumber,
  totalInCents,
  currency = "USD",
  items,
  actionUrl,
}: OrderConfirmationEmailProps) {
  return (
    <EmailLayout
      preview={`Order #${orderNumber} Confirmed`}
      actionUrl={actionUrl}
    >
      <Heading style={emailStyles.title}>Order Confirmed!</Heading>
      <Text style={emailStyles.paragraph}>
        Thank you for your purchase. We&apos;re getting your order ready to be
        shipped.
      </Text>
      <Section style={orderInfoBox}>
        <Text style={orderInfoLabel}>Order Reference</Text>
        <Text style={orderInfoValue}>#{orderNumber}</Text>
      </Section>
      <Hr style={emailStyles.divider} />
      <Text style={sectionTitle}>Items Ordered</Text>
      {items.map((item, idx) => (
        <Section key={idx} style={itemRow}>
          <Text style={itemName}>
            {item.name} <span style={itemQty}>× {item.quantity}</span>
          </Text>
          <Text style={itemPrice}>
            {formatMoney(item.priceInCents * item.quantity, currency)}
          </Text>
        </Section>
      ))}
      <Hr style={emailStyles.divider} />
      <Section style={totalRow}>
        <Text style={totalLabel}>Total</Text>
        <Text style={totalValue}>{formatMoney(totalInCents, currency)}</Text>
      </Section>
      {actionUrl ? (
        <EmailButton href={actionUrl}>View Order Status</EmailButton>
      ) : null}
    </EmailLayout>
  );
}

export default OrderConfirmationEmail;

const orderInfoBox: React.CSSProperties = {
  backgroundColor: emailTokens.colors.codeBackground,
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "0 0 20px",
};

const orderInfoLabel: React.CSSProperties = {
  fontSize: "11px",
  color: emailTokens.colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const orderInfoValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: emailTokens.colors.textPrimary,
  margin: "0",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: emailTokens.colors.textSubtle,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 16px",
};

const itemRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  margin: "8px 0",
};

const itemName: React.CSSProperties = {
  fontSize: "14px",
  color: "#d4d4d8",
  margin: "0",
};

const itemQty: React.CSSProperties = {
  color: emailTokens.colors.textMuted,
  fontSize: "13px",
};

const itemPrice: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "500",
  color: emailTokens.colors.textPrimary,
  margin: "0",
  textAlign: "right",
};

const totalRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  margin: "12px 0",
};

const totalLabel: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  color: emailTokens.colors.textPrimary,
  margin: "0",
};

const totalValue: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "bold",
  color: emailTokens.colors.textPrimary,
  margin: "0",
};
