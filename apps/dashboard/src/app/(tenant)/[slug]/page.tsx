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

export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-muted-foreground text-sm">Merchant workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight capitalize">
          {slug} overview
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your store workspace is ready for catalog and order workflows.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workspace foundation</CardTitle>
          <CardDescription>
            Operational metrics will appear here when their domain endpoints are
            available.
          </CardDescription>
        </CardHeader>
      </Card>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No dashboard metrics yet</EmptyTitle>
          <EmptyDescription>
            This structural home does not invent production data. Continue with
            Products, Orders, or Team from the workspace navigation.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
