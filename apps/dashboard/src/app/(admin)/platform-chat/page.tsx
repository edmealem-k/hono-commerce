import {
  Card,
  CardDescription,
  CardTitle,
} from "@hono-commerce/ui/components/card";

export default function PlatformChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Platform Support Escalation
        </h1>
        <p className="text-muted-foreground text-sm">
          Direct communication channels between superadmins and tenant store
          owners.
        </p>
      </div>

      <Card className="flex h-64 items-center justify-center rounded-2xl border p-6 text-center shadow-sm">
        <div className="max-w-sm space-y-2">
          <CardTitle>Escalation Channels Connected</CardTitle>
          <CardDescription>
            Superadmins can join tenant support rooms to resolve billing and
            technical issues.
          </CardDescription>
        </div>
      </Card>
    </div>
  );
}
