"use client";

import { Button } from "@hono-commerce/ui/components/button";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@hono-commerce/ui/components/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@hono-commerce/ui/components/sheet";
import { cn } from "@hono-commerce/ui/lib/utils";
import { XIcon } from "lucide-react";

import { useDrawer, type DrawerConfig } from "./use-drawer";

export function GlobalDrawer() {
  const { stack, closeDrawer, drawerCount } = useDrawer();

  if (drawerCount === 0) return null;

  return (
    <>
      {stack.map((drawer, index) => {
        const isTopDrawer = index === drawerCount - 1;
        return (
          <DrawerItem
            key={drawer.id || index}
            drawer={drawer}
            isTop={isTopDrawer}
            index={index}
            onClose={() => isTopDrawer && closeDrawer()}
          />
        );
      })}
    </>
  );
}

function DrawerItem({
  drawer,
  isTop,
  index,
  onClose,
}: {
  drawer: DrawerConfig;
  isTop: boolean;
  index: number;
  onClose: () => void;
}) {
  const side = drawer.placement ?? "right";
  const canResize =
    (side === "left" || side === "right") && (drawer.resizable ?? true);
  const defaultSize = Math.min(90, Math.max(10, drawer.defaultSize ?? 40));
  const spacerSize = 100 - defaultSize;
  const requestClose = () => {
    void (async () => {
      const allowed = await drawer.onRequestClose?.();
      if (allowed === false) return;
      onClose();
    })();
  };

  const drawerBody = (
    <div className="bg-background flex size-full flex-col overflow-hidden">
      <SheetTitle className="sr-only">
        {drawer.title ?? "Drawer Panel"}
      </SheetTitle>
      {!drawer.naked && (
        <SheetHeader className="border-border/60 flex shrink-0 items-start justify-between border-b px-5 py-4">
          <div className="space-y-1">
            {drawer.title && (
              <SheetTitle className="text-base font-semibold">
                {drawer.title}
              </SheetTitle>
            )}
            {drawer.description && (
              <SheetDescription className="text-xs">
                {drawer.description}
              </SheetDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Close drawer"
            onClick={requestClose}
          >
            <XIcon className="size-4" />
          </Button>
        </SheetHeader>
      )}
      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-y-auto",
          drawer.className,
        )}
      >
        {drawer.view}
      </div>
    </div>
  );

  return (
    <Sheet open onOpenChange={(open) => !open && isTop && requestClose()}>
      {canResize ? (
        <SheetContent
          side={side}
          showCloseButton={false}
          className="pointer-events-none fixed inset-0 z-50 h-full w-screen max-w-none border-0 bg-transparent p-0 shadow-none"
          data-drawer-index={index}
        >
          <ResizablePanelGroup className="size-full">
            {side === "right" ? (
              <>
                <ResizablePanel
                  defaultSize={spacerSize}
                  className="pointer-events-none"
                />
                <ResizableHandle
                  withHandle
                  className="bg-border/40 pointer-events-auto z-50 w-2 cursor-col-resize"
                />
                <ResizablePanel
                  defaultSize={defaultSize}
                  minSize={drawer.minSize ?? 20}
                  maxSize={drawer.maxSize ?? 90}
                  className="border-border bg-background pointer-events-auto relative flex flex-col overflow-hidden border-l shadow-2xl"
                >
                  {drawerBody}
                </ResizablePanel>
              </>
            ) : (
              <>
                <ResizablePanel
                  defaultSize={defaultSize}
                  minSize={drawer.minSize ?? 20}
                  maxSize={drawer.maxSize ?? 90}
                  className="border-border bg-background pointer-events-auto relative flex flex-col overflow-hidden border-r shadow-2xl"
                >
                  {drawerBody}
                </ResizablePanel>
                <ResizableHandle
                  withHandle
                  className="bg-border/40 pointer-events-auto z-50 w-2 cursor-col-resize"
                />
                <ResizablePanel
                  defaultSize={spacerSize}
                  className="pointer-events-none"
                />
              </>
            )}
          </ResizablePanelGroup>
        </SheetContent>
      ) : (
        <SheetContent
          side={side}
          showCloseButton={false}
          className={cn(
            "p-0",
            drawer.size === "sm" && "sm:max-w-sm",
            drawer.size === "md" && "sm:max-w-md",
            drawer.size === "lg" && "sm:max-w-lg",
            drawer.size === "xl" && "sm:max-w-xl",
            drawer.size === "full" && "sm:max-w-none w-screen",
          )}
          data-drawer-index={index}
          style={
            drawer.customSize
              ? side === "left" || side === "right"
                ? { width: drawer.customSize, maxWidth: drawer.customSize }
                : { height: drawer.customSize }
              : undefined
          }
        >
          {drawerBody}
        </SheetContent>
      )}
    </Sheet>
  );
}
