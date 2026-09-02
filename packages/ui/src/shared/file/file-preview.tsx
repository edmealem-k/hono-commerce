"use client";

import { Button } from "@hono-commerce/ui/components/button";
import { cn } from "@hono-commerce/ui/lib/utils";
import { DownloadIcon, FileIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { inferMimeType, MimeIcon } from "./mime-icon";

export interface FilePreviewProps {
  url: string;
  type?: string | null;
  fileName?: string | null;
  className?: string;
  onDownload?: () => void;
}

export function FilePreview({
  url,
  type,
  fileName,
  className,
  onDownload,
}: FilePreviewProps) {
  const resolvedType = inferMimeType(type, fileName || url);

  // 1. PDF Preview
  if (resolvedType === "application/pdf") {
    return (
      <iframe
        src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
        className={cn(
          "size-full min-h-[400px] border-0 rounded-md bg-background",
          className,
        )}
        title={fileName || "PDF Document Preview"}
      />
    );
  }

  // 2. Image Preview
  if (resolvedType.startsWith("image/")) {
    return (
      <div
        className={cn(
          "relative flex size-full items-center justify-center overflow-hidden p-2",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={fileName || "File preview"}
          className="max-h-full max-w-full rounded-md object-contain shadow-sm"
        />
      </div>
    );
  }

  // 3. Video Preview
  if (resolvedType.startsWith("video/")) {
    return (
      <div
        className={cn(
          "flex size-full items-center justify-center p-4",
          className,
        )}
      >
        <video
          src={url}
          controls
          controlsList="nodownload"
          className="max-h-full max-w-full rounded-lg shadow-md"
        >
          <track kind="captions" />
        </video>
      </div>
    );
  }

  // 4. Audio Preview
  if (resolvedType.startsWith("audio/")) {
    return (
      <div
        className={cn(
          "flex size-full flex-col items-center justify-center gap-6 p-8 text-center",
          className,
        )}
      >
        <div className="bg-primary/10 text-primary rounded-full p-6">
          <MimeIcon mime={resolvedType} size={48} />
        </div>
        <div className="w-full max-w-md">
          <audio
            src={url}
            controls
            controlsList="nodownload"
            className="w-full"
          >
            <track kind="captions" />
          </audio>
        </div>
        <p className="text-muted-foreground text-xs font-medium">
          {fileName || "Audio track preview"}
        </p>
      </div>
    );
  }

  // 5. Text / Code Preview
  if (
    resolvedType.startsWith("text/") ||
    resolvedType === "application/json" ||
    resolvedType === "application/xml"
  ) {
    return <TextFilePreview url={url} className={className} />;
  }

  // 6. Unsupported / Binary Fallback
  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-4 p-8 text-center",
        className,
      )}
    >
      <div className="bg-muted rounded-full p-6">
        <FileIcon className="text-muted-foreground size-12" />
      </div>
      <div>
        <p className="text-sm font-semibold">{fileName || "File Document"}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Direct inline preview is not supported for this file format.
        </p>
      </div>
      {onDownload ? (
        <Button variant="outline" size="sm" onClick={onDownload}>
          <DownloadIcon className="mr-2 size-4" />
          Download File
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          render={
            <a href={url} download={fileName || "download"}>
              <DownloadIcon className="mr-2 inline size-4" />
              Download File
            </a>
          }
        />
      )}
    </div>
  );
}

function TextFilePreview({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load text file preview");
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setContent(text.slice(0, 50000));
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load preview",
          );
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <div className="text-destructive flex size-full items-center justify-center p-6 text-sm">
        {error}
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="text-muted-foreground flex size-full items-center justify-center p-6 text-sm">
        Loading document preview...
      </div>
    );
  }

  return (
    <div
      className={cn(
        "size-full overflow-auto bg-muted/20 p-4 font-mono text-xs leading-relaxed",
        className,
      )}
    >
      <pre className="break-words whitespace-pre-wrap">{content}</pre>
    </div>
  );
}
