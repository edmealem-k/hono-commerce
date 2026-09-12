import { ModeToggle } from "@/components/mode-toggle";
import { routes } from "@/lib/routes";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

export default async function TenantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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
                {slug}.localhost:3002
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href={routes.tenant.products}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <Package className="text-muted-foreground size-4" />
              Products & Variants
            </Link>
            <Link
              href={routes.tenant.orders}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <ShoppingCart className="text-muted-foreground size-4" />
              Orders & Fulfillment
            </Link>
            <Link
              href={routes.tenant.team}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <Users className="text-muted-foreground size-4" />
              Team & Permissions
            </Link>
            <Link
              href={routes.tenant.chat}
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
