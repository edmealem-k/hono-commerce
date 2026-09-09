import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

import type { Route } from "next";

export default async function TenantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const rawSubdomain = hostname.split(".")[0] ?? "";
  const isSubdomain = rawSubdomain !== "localhost" && hostname.includes(".");
  const prefix = isSubdomain ? "" : `/${slug}`;

  return (
    <div className="bg-background flex min-h-screen">
      {/* Sidebar */}
      <aside className="border-border bg-card/50 flex w-64 flex-col justify-between border-r p-4">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg font-bold uppercase">
              {slug[0] || "T"}
            </div>
            <div>
              <div className="text-sm font-semibold capitalize">{slug}</div>
              <div className="text-muted-foreground text-xs">
                {slug}.shop.com
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href={`${prefix}/products` as Route}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <Package className="text-muted-foreground size-4" />
              Products & Variants
            </Link>
            <Link
              href={`${prefix}/orders` as Route}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <ShoppingCart className="text-muted-foreground size-4" />
              Orders & Fulfillment
            </Link>
            <Link
              href={`${prefix}/team` as Route}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <Users className="text-muted-foreground size-4" />
              Team & Permissions
            </Link>
            <Link
              href={`${prefix}/chat` as Route}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <MessageSquare className="text-muted-foreground size-4" />
              Customer Support Chat
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
