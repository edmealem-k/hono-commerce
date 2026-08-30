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

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Orders & Fulfillment
        </h1>
        <p className="text-muted-foreground text-sm">
          Track customer purchases, fulfillment state machines, and Stripe
          payout splits.
        </p>
      </div>

      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Live customer orders requiring processing or delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs">
                  ord_98324823
                </TableCell>
                <TableCell>alex.smith@example.com</TableCell>
                <TableCell className="font-semibold tabular-nums">
                  $134.00
                </TableCell>
                <TableCell>
                  <Badge variant="outline">PROCESSING</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">PAID</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
