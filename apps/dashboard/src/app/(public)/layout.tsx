import Link from "next/link";

import type { ReactNode } from "react";

export default function PublicAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-between px-4 py-8 sm:px-6">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.08),rgba(0,0,0,0))]" />

      {/* Top Brand Header */}
      <header className="relative z-10 flex w-full max-w-md justify-center py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-bold tracking-tight transition-opacity hover:opacity-90"
        >
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg font-black shadow-sm">
            H
          </div>
          <span className="text-foreground">Hono Commerce</span>
        </Link>
      </header>

      {/* Centered Main Content Area */}
      <main className="relative z-10 my-auto w-full max-w-md">{children}</main>

      {/* Bottom Footer */}
      <footer className="text-muted-foreground relative z-10 w-full max-w-md py-4 text-center text-xs">
        &copy; {new Date().getFullYear()} Hono Commerce. All rights reserved.
      </footer>
    </div>
  );
}
