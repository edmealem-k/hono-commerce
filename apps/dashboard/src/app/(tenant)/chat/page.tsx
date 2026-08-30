import {
  Card,
  CardDescription,
  CardTitle,
} from "@hono-commerce/ui/components/card";

export default function TenantChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Customer Support & Team Chat
        </h1>
        <p className="text-muted-foreground text-sm">
          Live real-time messaging with customers and internal staff over
          Socket.io.
        </p>
      </div>

      <Card className="flex h-[500px] items-center justify-center rounded-2xl border p-6 text-center shadow-sm">
        <div className="max-w-sm space-y-2">
          <CardTitle>Real-Time Chat Connected</CardTitle>
          <CardDescription>
            Chat rooms are automatically initialized for customer inquiries and
            store staff collaboration.
          </CardDescription>
        </div>
      </Card>
    </div>
  );
}
