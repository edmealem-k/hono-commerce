import { env } from "@hono-commerce/env/dashboard";
import { Button } from "@hono-commerce/ui/components/button";
import { Card } from "@hono-commerce/ui/components/card";
import { ExternalLink } from "lucide-react";

export default function AdminQueuesPage() {
  const bullBoardUrl = `${env.NEXT_PUBLIC_SERVER_URL}/admin/queues`;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Queue Monitoring
          </h1>
          <p className="text-muted-foreground text-sm">
            Inspect BullMQ throughput, active jobs, failed attempts, and
            dead-letter queues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={bullBoardUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="size-4" />
              Open Standalone
            </Button>
          </a>
        </div>
      </div>

      <Card className="border-border flex-1 overflow-hidden rounded-2xl border shadow-sm">
        <iframe
          src={bullBoardUrl}
          className="bg-background h-full w-full border-0"
          title="BullMQ Queue Dashboard"
        />
      </Card>
    </div>
  );
}
