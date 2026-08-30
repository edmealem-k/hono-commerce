"use client";

import { Button } from "@hono-commerce/ui/components/button";
import { Card, CardContent } from "@hono-commerce/ui/components/card";
import { cn } from "@hono-commerce/ui/lib/utils";
import { ArrowRightIcon } from "lucide-react";

import { StatusPill, type StatusTone } from "./status-pill";

import type { LucideIcon } from "lucide-react";

export interface QueueCardProps {
  title: string;
  detail: string;
  statusLabel: string;
  statusTone?: StatusTone;
  priorityLabel?: string;
  ownerLabel?: string;
  impactLabel?: string;
  ctaLabel?: string;
  ctaIcon?: LucideIcon;
  onCtaClick?: () => void;
  className?: string;
}

export function QueueCard({
  title,
  detail,
  statusLabel,
  statusTone = "neutral",
  priorityLabel,
  ownerLabel,
  impactLabel,
  ctaLabel = "Review",
  ctaIcon: CtaIcon = ArrowRightIcon,
  onCtaClick,
  className,
}: QueueCardProps) {
  return (
    <Card
      className={cn(
        "border-border/70 rounded-xl transition-all duration-200 hover:border-primary/40 hover:shadow-xs",
        className,
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-foreground text-sm font-semibold tracking-tight sm:text-base">
                {title}
              </h3>
              <StatusPill label={statusLabel} tone={statusTone} dot />
              {priorityLabel && (
                <StatusPill label={priorityLabel} tone="warning" />
              )}
            </div>

            <p className="text-muted-foreground max-w-3xl text-xs leading-relaxed sm:text-sm">
              {detail}
            </p>

            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              {ownerLabel && (
                <span className="bg-muted/70 rounded-md px-2 py-0.5 font-medium">
                  Owner: {ownerLabel}
                </span>
              )}
              {impactLabel && (
                <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-semibold">
                  {impactLabel}
                </span>
              )}
            </div>
          </div>

          {onCtaClick && (
            <Button
              size="sm"
              className="shrink-0 rounded-full"
              onClick={onCtaClick}
            >
              {ctaLabel}
              <CtaIcon className="ml-1.5 size-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
