"use client";

import { Card, CardContent } from "@hono-commerce/ui/components/card";
import { cn } from "@hono-commerce/ui/lib/utils";

import type { LucideIcon } from "lucide-react";

export interface MetricTileProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  tone?: string;
  className?: string;
}

export function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
  trend,
  tone,
  className,
}: MetricTileProps) {
  return (
    <Card
      className={cn(
        "border-border/60 rounded-xl shadow-xs transition-colors hover:border-primary/30",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] font-bold tracking-[0.16em] uppercase">
              {label}
            </p>
            <p
              className={cn(
                "text-foreground mt-2 truncate text-2xl font-bold tracking-tight",
                tone,
              )}
            >
              {value}
            </p>
          </div>

          <div className="border-border/60 bg-muted/40 text-primary flex size-10 items-center justify-center rounded-xl border p-2">
            <Icon className="size-5" />
          </div>
        </div>

        {(detail || trend) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  "font-semibold",
                  trend.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
                )}
              >
                {trend.value}
              </span>
            )}
            {detail && (
              <p className="text-muted-foreground truncate">{detail}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const StatCard = MetricTile;
