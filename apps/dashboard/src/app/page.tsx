import { ModeToggle } from "@/components/mode-toggle";
import { routes, toSubdomainUrl } from "@/lib/routes";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hono-commerce/ui/components/card";
import { Store, ShieldCheck } from "lucide-react";

export default function DashboardPortalSelector() {
  const storeUrl = toSubdomainUrl("default", routes.tenant.products);
  const adminUrl = toSubdomainUrl("admin", routes.admin.tenants);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6">
      <div className="absolute top-6 right-6">
        <ModeToggle />
      </div>

      <div className="w-full max-w-3xl space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Hono Commerce Console
          </h1>
          <p className="text-muted-foreground text-lg">
            Select your workspace portal to manage your merchant store or system
            administration.
          </p>
        </div>

        <div className="grid gap-6 text-left md:grid-cols-2">
          <Card className="hover:border-primary/50 rounded-2xl border shadow-md transition-all">
            <CardHeader>
              <div className="bg-primary/10 mb-3 flex size-12 items-center justify-center rounded-xl">
                <Store className="text-primary size-6" />
              </div>
              <CardTitle className="text-xl">Store Management</CardTitle>
              <CardDescription>
                Manage your catalog, inventory, variant matrices, orders, staff
                permissions, and customer chats.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href={storeUrl} className="w-full">
                <Button className="w-full">Open Store Dashboard</Button>
              </a>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 rounded-2xl border shadow-md transition-all">
            <CardHeader>
              <div className="bg-primary/10 mb-3 flex size-12 items-center justify-center rounded-xl">
                <ShieldCheck className="text-primary size-6" />
              </div>
              <CardTitle className="text-xl">Platform Administration</CardTitle>
              <CardDescription>
                Manage global tenants, review moderation, billing plans,
                platform commission splits, and escalations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href={adminUrl} className="w-full">
                <Button variant="secondary" className="w-full">
                  Open Superadmin
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
