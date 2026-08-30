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
import { UserPlus } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Team & Dynamic RBAC
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage staff role groups and granular 4-segment permission keys
            (WORKSPACE:MODULE:RESOURCE:ACTION).
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="size-4" />
          Invite Staff
        </Button>
      </div>

      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            Users authorized to access this tenant workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role Group</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  Store Owner (owner@store.com)
                </TableCell>
                <TableCell>
                  <Badge>Store Owner (All Permissions)</Badge>
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
