"use client";

import { Button } from "@hono-commerce/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@hono-commerce/ui/components/drawer";
import { cn } from "@hono-commerce/ui/lib/utils";
import { LockIcon, Maximize2Icon, Minimize2Icon, EyeIcon } from "lucide-react";
import { useState } from "react";

import { MimeIcon } from "./mime-icon";
import { FileRenderer } from "./preview/file-renderer";

export interface FilePreviewDrawerProps {
  url: string;
  type?: string | null;
  fileName?: string | null;
  isPrivate?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
}

export function FilePreviewDrawer({
  url,
  type,
  fileName,
  isPrivate = false,
  open,
  onOpenChange,
  trigger,
}: FilePreviewDrawerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger render={trigger} />}
      <DrawerContent
        className={cn(
          "transition-all duration-300 ease-in-out p-0 flex flex-col",
          isFullscreen
            ? "h-[100dvh] max-h-[100dvh]"
            : "h-[80dvh] max-h-[85dvh]",
        )}
      >
        <DrawerHeader className="border-border/60 flex items-center justify-between border-b px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <MimeIcon mime={type} fileName={fileName} size={22} />
            <DrawerTitle className="truncate text-sm font-semibold">
              {fileName || "File Preview"}
            </DrawerTitle>
            {isPrivate && (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
                <LockIcon className="size-3" />
                Private
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2Icon className="size-4" />
              ) : (
                <Maximize2Icon className="size-4" />
              )}
            </Button>
            <DrawerClose
              render={
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Close
                </Button>
              }
            />
          </div>
        </DrawerHeader>

        <div className="bg-muted/10 relative min-h-0 flex-1 overflow-hidden">
          <FileRenderer url={url} mimeType={type} fileName={fileName} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function FilePreviewButton({
  url,
  type,
  fileName,
  isPrivate,
  label = "Preview",
  className,
}: {
  url?: string | null;
  type?: string | null;
  fileName?: string | null;
  isPrivate?: boolean;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!url) {
    return (
      <Button size="sm" variant="outline" disabled className={className}>
        <EyeIcon className="mr-1.5 size-3.5" />
        {label}
      </Button>
    );
  }

  return (
    <FilePreviewDrawer
      url={url}
      type={type}
      fileName={fileName}
      isPrivate={isPrivate}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" variant="outline" className={className}>
          <EyeIcon className="mr-1.5 size-3.5" />
          {label}
        </Button>
      }
    />
  );
}
