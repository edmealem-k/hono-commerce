import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@hono-commerce/ui/components/button";
import { Building2, ShieldAlert, Headphones, ChevronLeft } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

import type { Route } from "next";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const isSubdomain = hostname.startsWith("admin.");
  const prefix = isSubdomain ? "" : "/admin";

  return (
    <div className="bg-background flex min-h-screen">
      {/* Superadmin Sidebar */}
      <aside className="border-border bg-card/50 flex w-64 flex-col justify-between border-r p-4">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <div className="bg-destructive text-destructive-foreground flex size-8 items-center justify-center rounded-lg font-bold">
              A
            </div>
            <div>
              <div className="text-sm font-semibold">Superadmin</div>
              <div className="text-muted-foreground text-xs">
                admin.shop.com
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href={`${prefix}/tenants` as Route}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <Building2 className="text-muted-foreground size-4" />
              Tenants & Subscriptions
            </Link>
            <Link
              href={`${prefix}/moderation` as Route}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <ShieldAlert className="text-muted-foreground size-4" />
              Review Moderation
            </Link>
            <Link
              href={`${prefix}/platform-chat` as Route}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <Headphones className="text-muted-foreground size-4" />
              Escalation Support
            </Link>
          </nav>
        </div>

        <div className="border-border space-y-4 border-t pt-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-muted-foreground text-xs">Appearance</span>
            <ModeToggle />
          </div>
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <ChevronLeft className="size-4" />
              Portal Selector
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}
