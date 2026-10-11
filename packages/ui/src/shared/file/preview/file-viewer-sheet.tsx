"use client";

import { Button } from "@hono-commerce/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@hono-commerce/ui/components/sheet";
import { DownloadIcon, FileIcon, XIcon } from "lucide-react";

import { FileRenderer } from "./file-renderer";

export interface FileViewerFile {
  url: string;
  fileName: string;
  mimeType?: string;
  type?: string;
}

export interface FileViewerSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileViewerFile | null;
  title?: string;
  showDownload?: boolean;
}

export function FileViewerSheet({
  isOpen,
  onOpenChange,
  file,
  title,
  showDownload = true,
}: FileViewerSheetProps) {
  const download = () => {
    if (!file) return;
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.fileName || "download";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="flex h-[95dvh] w-full flex-col p-0"
      >
        <SheetHeader className="border-border flex shrink-0 flex-row items-center justify-between border-b px-4 py-3 sm:px-6">
          <SheetTitle className="min-w-0 truncate text-sm font-semibold">
            {title ?? file?.fileName ?? "File preview"}
          </SheetTitle>
          <div className="flex items-center gap-2">
            {showDownload && file ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={download}
              >
                <DownloadIcon className="size-3.5" aria-hidden="true" />{" "}
                Download
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              aria-label="Close preview"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </SheetHeader>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {file ? (
            <FileRenderer
              url={file.url}
              fileName={file.fileName}
              mimeType={file.mimeType ?? file.type}
            />
          ) : (
            <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-3 text-sm">
              <FileIcon className="size-10" aria-hidden="true" />
              <span>No file selected</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ResumeViewerSheet({
  isOpen,
  onOpenChange,
  resumeUrl,
  talentName = "Talent",
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resumeUrl?: string;
  talentName?: string;
}) {
  return (
    <FileViewerSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      file={
        resumeUrl
          ? {
              url: resumeUrl,
              fileName: `${talentName}'s Resume`,
              mimeType: "application/pdf",
            }
          : null
      }
      title={`${talentName}'s Resume`}
    />
  );
}
