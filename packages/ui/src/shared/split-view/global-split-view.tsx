"use client";

import { Button } from "@hono-commerce/ui/components/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@hono-commerce/ui/components/resizable";
import { cn } from "@hono-commerce/ui/lib/utils";
import { Maximize2Icon, Minimize2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { useSplitView } from "./use-split-view";

export function GlobalSplitView({ children }: { children: React.ReactNode }) {
  const {
    isOpen,
    view,
    header,
    title,
    description,
    defaultSize = 50,
    minSize = 30,
    maxSize = 70,
    className,
    closeSplitView,
  } = useSplitView();

  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !view) {
    return <>{children}</>;
  }

  const leftSize = isFullscreen ? 0 : 100 - defaultSize;
  const rightSize = isFullscreen ? 100 : defaultSize;

  return (
    <ResizablePanelGroup className="size-full overflow-hidden">
      <ResizablePanel
        defaultSize={leftSize}
        minSize={isFullscreen ? 0 : 100 - maxSize}
        maxSize={isFullscreen ? 0 : 100 - minSize}
        className={cn("size-full overflow-y-auto", isFullscreen && "hidden")}
      >
        {children}
      </ResizablePanel>

      {!isFullscreen && (
        <ResizableHandle
          withHandle
          className="bg-border/40 w-2 cursor-col-resize"
        />
      )}

      <ResizablePanel
        defaultSize={rightSize}
        minSize={isFullscreen ? 100 : minSize}
        maxSize={isFullscreen ? 100 : maxSize}
        className={cn(
          "border-border/60 relative flex size-full flex-col overflow-hidden border-l bg-background shadow-xl",
          className,
        )}
      >
        <div className="border-border/60 flex shrink-0 items-center justify-between border-b px-4 py-3">
          {header ?? (
            <div className="space-y-0.5">
              {title && (
                <h4 className="text-foreground text-sm font-semibold">
                  {title}
                </h4>
              )}
              {description && (
                <p className="text-muted-foreground text-xs">{description}</p>
              )}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Restore" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2Icon className="size-3.5" />
              ) : (
                <Maximize2Icon className="size-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={closeSplitView}
              title="Close panel"
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto">{view}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
