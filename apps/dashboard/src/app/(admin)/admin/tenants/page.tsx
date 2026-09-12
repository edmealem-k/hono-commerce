import { Badge } from "@hono-commerce/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hono-commerce/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hono-commerce/ui/components/table";

export default function SuperadminTenantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Platform Tenants & Billing
        </h1>
        <p className="text-muted-foreground text-sm">
          System-wide overview of onboarded merchants, Stripe Connect KYC
          status, and SaaS subscription tiers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total Active Stores</CardDescription>
            <CardTitle className="text-2xl tabular-nums">12</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Monthly Platform GMV</CardDescription>
            <CardTitle className="text-2xl tabular-nums">$48,290.00</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Platform Fee Revenue (2.5%)</CardDescription>
            <CardTitle className="text-primary text-2xl tabular-nums">
              $1,207.25
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>Registered Storefronts</CardTitle>
          <CardDescription>
            All multi-tenant shops provisioned across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Stripe Connect</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Acme Apparel</TableCell>
                <TableCell className="font-mono text-xs">
                  acme.localhost:3002
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">Pro ($49/mo)</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">Verified</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">Active</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
