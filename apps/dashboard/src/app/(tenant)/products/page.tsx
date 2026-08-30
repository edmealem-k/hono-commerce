import { Badge } from "@hono-commerce/ui/components/badge";
import { Button } from "@hono-commerce/ui/components/button";
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
import { Plus } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Products & Variant Matrices
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your store catalog, SKU matrices, and inventory levels.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total Active SKUs</CardDescription>
            <CardTitle className="text-2xl tabular-nums">48</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Alerts</CardDescription>
            <CardTitle className="text-2xl text-amber-500 tabular-nums">
              3
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Out of Stock</CardDescription>
            <CardTitle className="text-destructive text-2xl tabular-nums">
              0
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>Catalog Items</CardTitle>
          <CardDescription>
            Live products currently available in your storefront.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  Organic Cotton Hoodie
                </TableCell>
                <TableCell className="font-mono text-xs">HOOD-BLK-L</TableCell>
                <TableCell className="font-semibold tabular-nums">
                  $89.00
                </TableCell>
                <TableCell className="tabular-nums">24 in stock</TableCell>
                <TableCell>
                  <Badge variant="secondary">Active</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  Minimalist Leather Wallet
                </TableCell>
                <TableCell className="font-mono text-xs">WLT-BRN-01</TableCell>
                <TableCell className="font-semibold tabular-nums">
                  $45.00
                </TableCell>
                <TableCell className="tabular-nums">12 in stock</TableCell>
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
