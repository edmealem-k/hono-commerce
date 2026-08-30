import {
  Card,
  CardDescription,
  CardTitle,
} from "@hono-commerce/ui/components/card";

export default function ModerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Review & Content Moderation
        </h1>
        <p className="text-muted-foreground text-sm">
          Platform-level moderation queue for verified buyer reviews and
          reported storefront content.
        </p>
      </div>

      <Card className="flex h-64 items-center justify-center rounded-2xl border p-6 text-center shadow-sm">
        <div className="max-w-sm space-y-2">
          <CardTitle>Moderation Queue Clean</CardTitle>
          <CardDescription>
            No pending review flags or reported products requiring admin
            intervention.
          </CardDescription>
        </div>
      </Card>
    </div>
  );
}
