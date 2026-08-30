"use client";

import { Button } from "@hono-commerce/ui/components/button";
import { cn } from "@hono-commerce/ui/lib/utils";
import {
  CheckCircle2Icon,
  AlertCircleIcon,
  ArrowRightIcon,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type StepStatus =
  | "completed"
  | "action-required"
  | "pending"
  | "blocked";

export interface OnboardingStep {
  id: string;
  title: string;
  description: React.ReactNode;
  status: StepStatus;
  summary?: React.ReactNode;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  disabled?: boolean;
}

export function OnboardingTimeline({
  steps,
  className,
}: {
  steps: OnboardingStep[];
  className?: string;
}) {
  return (
    <div className={cn("relative space-y-6", className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCompleted = step.status === "completed";
        const isActionRequired = step.status === "action-required";
        const ActionIcon = step.actionIcon || ArrowRightIcon;

        return (
          <div
            key={step.id}
            className={cn(
              "relative flex gap-4 sm:gap-6",
              step.disabled && "pointer-events-none opacity-50 grayscale-50",
            )}
          >
            {/* Step Number / Icon Badge */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-4 ring-background shadow-sm transition-all duration-300",
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isActionRequired
                      ? "bg-primary text-primary-foreground animate-pulse"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? (
                  <CheckCircle2Icon className="size-5" />
                ) : isActionRequired ? (
                  <AlertCircleIcon className="size-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[40px] transition-colors",
                    isCompleted ? "bg-emerald-500/40" : "bg-border/60",
                  )}
                />
              )}
            </div>

            {/* Step Content */}
            <div className="min-w-0 flex-1 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-foreground text-sm font-semibold tracking-tight sm:text-base">
                  {step.title}
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                    isCompleted
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : isActionRequired
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted text-muted-foreground border-border/50",
                  )}
                >
                  {step.status.replace("-", " ")}
                </span>
              </div>

              <div className="text-muted-foreground mt-1.5 text-xs leading-relaxed sm:text-sm">
                {step.description}
              </div>

              {step.summary && (
                <div className="mt-3 flex flex-wrap gap-2">{step.summary}</div>
              )}

              {step.onAction && !isCompleted && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    className="rounded-full px-5 text-xs font-semibold"
                    onClick={step.onAction}
                    disabled={step.disabled}
                  >
                    <span>{step.actionLabel || "Configure"}</span>
                    <ActionIcon className="ml-1.5 size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const StepCard = OnboardingTimeline;
