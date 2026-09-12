import { ModeToggle } from "@/components/mode-toggle";
import { routes } from "@/lib/routes";
import { Button } from "@hono-commerce/ui/components/button";
import { Building2, ShieldAlert, Headphones, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
                admin.localhost:3002
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href={routes.admin.tenants}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <Building2 className="text-muted-foreground size-4" />
              Tenants & Subscriptions
            </Link>
            <Link
              href={routes.admin.moderation}
              className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              <ShieldAlert className="text-muted-foreground size-4" />
              Review Moderation
            </Link>
            <Link
              href={routes.admin.platformChat}
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
