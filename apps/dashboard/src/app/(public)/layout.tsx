import Image from "next/image";
import Link from "next/link";

import type { ReactNode } from "react";

export default function PublicAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-background min-h-svh lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <main className="flex min-h-svh flex-col px-4 py-6 sm:px-8 lg:px-16 lg:py-10">
        <header className="flex items-center">
          <Link
            href="/"
            className="text-foreground inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg font-bold">
              H
            </span>
            Hono Commerce
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <footer className="text-muted-foreground text-xs">
          &copy; {new Date().getFullYear()} Hono Commerce
        </footer>
      </main>
      <aside className="bg-muted relative hidden min-h-svh overflow-hidden border-l lg:block">
        <Image
          src="/brand/hono-commerce-login-visual.svg"
          alt="A calm commerce workspace illustration"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1024px) 55vw, 0vw"
        />
        <div className="from-background/90 via-background/20 absolute inset-0 bg-gradient-to-t to-transparent" />
        <div className="absolute right-12 bottom-12 left-12 max-w-lg">
          <p className="text-foreground text-3xl font-semibold tracking-tight">
            One workspace for every store you operate.
          </p>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Sign in to choose an authorized workspace and continue managing your
            commerce operations.
          </p>
        </div>
      </aside>
    </div>
  );
}
