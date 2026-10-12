import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@hono-commerce/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@hono-commerce/ui/components/empty";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-muted-foreground text-sm">Platform workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Operations overview
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Platform tools will appear here as their permissioned contracts ship.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Platform foundation</CardTitle>
          <CardDescription>
            This shell intentionally contains no fabricated tenant, revenue, or
            queue metrics.
          </CardDescription>
        </CardHeader>
      </Card>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No platform overview data yet</EmptyTitle>
          <EmptyDescription>
            Open Tenants from the sidebar when the platform tenant contract is
            available.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
