import { Providers } from "@/components/providers";

import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "Hono Commerce - Management Console",
  description: "Multi-tenant merchant store and platform administration portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
