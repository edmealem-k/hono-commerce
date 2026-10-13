"use client";

import { Button } from "@hono-commerce/ui/components/button";
import { Progress } from "@hono-commerce/ui/components/progress";
import { ArrowLeft, ArrowRight, LoaderCircle, X } from "lucide-react";

import type { ReactNode } from "react";

export interface MultiStepDefinition {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
}

export function MultiStepFlow({
  steps,
  currentStep,
  canGoNext = true,
  isSubmitting = false,
  onBack,
  onNext,
  onRequestClose,
}: {
  steps: readonly MultiStepDefinition[];
  currentStep: number;
  canGoNext?: boolean;
  isSubmitting?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  onRequestClose?: () => void;
}) {
  const step = steps.at(currentStep);
  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress =
    steps.length === 0 ? 0 : ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="bg-background flex min-h-full flex-col">
      <header className="border-border shrink-0 space-y-3 border-b px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Step {currentStep + 1} of {steps.length}
            </p>
            <h2 className="mt-1 text-base font-semibold">{step.title}</h2>
            {step.description && (
              <p className="text-muted-foreground mt-1 text-xs">
                {step.description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={onRequestClose}
          >
            <X className="size-4" />
          </Button>
        </div>
        <Progress
          value={progress}
          aria-label={`Step ${currentStep + 1} of ${steps.length}`}
        />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {step.content}
      </div>
      <footer className="border-border flex shrink-0 items-center justify-between gap-3 border-t px-5 py-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isFirst || isSubmitting}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!canGoNext || isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          {isLast ? "Finish" : "Next"}
          {!isLast && <ArrowRight className="size-4" />}
        </Button>
      </footer>
    </div>
  );
}
