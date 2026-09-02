"use client";

import { cn } from "@hono-commerce/ui/lib/utils";

import type { LucideIcon } from "lucide-react";

export type WorkspaceTone =
  | "setup"
  | "review"
  | "attention"
  | "live"
  | "ready"
  | "primary";

export interface WorkspaceHeroLayoutProps {
  tone?: WorkspaceTone;
  parentTitle?: string;
  icon: LucideIcon;
  badge?: string;
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  actions?: React.ReactNode;
  rightContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  className?: string;
}

const TONE_CONFIG: Record<
  WorkspaceTone,
  { glow: string; iconBg: string; dot: string }
> = {
  setup: {
    glow: "bg-amber-500/10",
    iconBg:
      "bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-orange-600 dark:text-orange-400",
    dot: "bg-amber-500",
  },
  review: {
    glow: "bg-blue-500/10",
    iconBg:
      "bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  attention: {
    glow: "bg-rose-500/10",
    iconBg:
      "bg-gradient-to-br from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  live: {
    glow: "bg-cyan-500/10",
    iconBg:
      "bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-600 dark:text-cyan-400",
    dot: "bg-cyan-500",
  },
  ready: {
    glow: "bg-emerald-500/10",
    iconBg:
      "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  primary: {
    glow: "bg-primary/10",
    iconBg: "bg-gradient-to-br from-primary/20 to-primary/10 text-primary",
    dot: "bg-primary",
  },
};

export function WorkspaceHeroLayout({
  tone = "primary",
  parentTitle = "Workspace",
  icon: Icon,
  badge,
  title,
  description,
  actions,
  rightContent,
  bottomContent,
  className,
}: WorkspaceHeroLayoutProps) {
  const config = TONE_CONFIG[tone];

  return (
    <section
      className={cn(
        "bg-glass-gradient-a border-border/50 relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-xs",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-[90px]",
          config.glow,
        )}
      />

      <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1.1fr]">
        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  config.iconBg,
                )}
              >
                <Icon className="size-5" />
              </div>

              <div className="space-y-0.5">
                <h6 className="text-foreground text-xs font-bold tracking-tight">
                  {parentTitle}
                </h6>
                {badge && (
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex size-2">
                      <span
                        className={cn(
                          "absolute inline-flex size-full animate-ping rounded-full opacity-75",
                          config.dot,
                        )}
                      />
                      <span
                        className={cn(
                          "relative inline-flex size-2 rounded-full",
                          config.dot,
                        )}
                      />
                    </span>
                    <span className="text-muted-foreground text-[10px] font-bold tracking-[0.18em] uppercase">
                      {badge}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              {typeof title === "string" ? (
                <h2 className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
                  {title}
                </h2>
              ) : (
                title
              )}

              {typeof description === "string" ? (
                <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                  {description}
                </p>
              ) : (
                description
              )}
            </div>
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {actions}
            </div>
          )}
        </div>

        {rightContent && (
          <div className="border-border/40 relative flex min-h-[140px] flex-col justify-center border-t pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            {rightContent}
          </div>
        )}
      </div>

      {bottomContent && (
        <div className="border-border/40 relative mt-6 border-t pt-4">
          {bottomContent}
        </div>
      )}
    </section>
  );
}

export const DashboardHero = WorkspaceHeroLayout;
