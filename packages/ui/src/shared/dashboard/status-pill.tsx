"use client";

import { Badge } from "@hono-commerce/ui/components/badge";
import { cn } from "@hono-commerce/ui/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "muted"
  | "primary"
  | "neutral";

export interface StatusPillProps {
  label: string;
  tone?: StatusTone;
  className?: string;
  dot?: boolean;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  success:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  warning:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  destructive:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  primary: "bg-primary/10 text-primary border-primary/20",
  muted: "bg-muted text-muted-foreground border-border/50",
  neutral: "bg-background text-foreground border-border",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  destructive: "bg-rose-500",
  info: "bg-blue-500",
  primary: "bg-primary",
  muted: "bg-muted-foreground",
  neutral: "bg-foreground",
};

export function StatusPill({
  label,
  tone = "neutral",
  className,
  dot = false,
}: StatusPillProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border inline-flex items-center gap-1.5",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("size-1.5 rounded-full shrink-0", DOT_CLASSES[tone])}
        />
      )}
      <span>{label}</span>
    </Badge>
  );
}
