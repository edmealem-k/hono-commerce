import Header from "@/components/header";
import Providers from "@/components/providers";
import NextTopLoader from "nextjs-toploader";

import "../index.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "hono-commerce",
  description: "hono-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <NextTopLoader showSpinner={false} />
        <Providers>
          <div className="grid h-svh grid-rows-[auto_1fr]">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
