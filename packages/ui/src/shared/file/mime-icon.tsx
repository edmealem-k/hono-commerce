"use client";

import { cn } from "@hono-commerce/ui/lib/utils";
import {
  FileIcon,
  FileTextIcon,
  FileCodeIcon,
  FileSpreadsheetIcon,
  FileArchiveIcon,
  FileAudioIcon,
  FileVideoIcon,
  ImageIcon,
} from "lucide-react";

export interface MimeIconProps {
  mime?: string | null;
  fileName?: string | null;
  className?: string;
  size?: number;
}

export function inferMimeType(
  mime?: string | null,
  fileName?: string | null,
): string {
  if (mime && mime.includes("/")) return mime.toLowerCase();
  if (!fileName) return "application/octet-stream";

  const firstPart = fileName.split("?")[0] ?? "";
  const cleanPath = firstPart.split("#")[0] ?? "";
  const ext = cleanPath.split(".").pop()?.toLowerCase() ?? "";

  const EXTENSION_MAP: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    aac: "audio/aac",
    flac: "audio/flac",
    zip: "application/zip",
    tar: "application/x-tar",
    gz: "application/gzip",
    "7z": "application/x-7z-compressed",
    json: "application/json",
    csv: "text/csv",
    txt: "text/plain",
    md: "text/markdown",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  return EXTENSION_MAP[ext] ?? "application/octet-stream";
}

export function MimeIcon({
  mime,
  fileName,
  className,
  size = 20,
}: MimeIconProps) {
  const resolved = inferMimeType(mime, fileName);

  if (resolved.startsWith("image/")) {
    return (
      <ImageIcon
        className={cn("text-blue-500 shrink-0", className)}
        size={size}
      />
    );
  }

  if (resolved.startsWith("video/")) {
    return (
      <FileVideoIcon
        className={cn("text-teal-500 shrink-0", className)}
        size={size}
      />
    );
  }

  if (resolved === "application/pdf") {
    return (
      <FileTextIcon
        className={cn("text-red-500 shrink-0", className)}
        size={size}
      />
    );
  }

  if (resolved.startsWith("audio/")) {
    return (
      <FileAudioIcon
        className={cn("text-purple-500 shrink-0", className)}
        size={size}
      />
    );
  }

  if (
    resolved === "application/zip" ||
    resolved === "application/x-tar" ||
    resolved === "application/gzip" ||
    resolved === "application/x-7z-compressed"
  ) {
    return (
      <FileArchiveIcon
        className={cn("text-amber-500 shrink-0", className)}
        size={size}
      />
    );
  }

  if (
    resolved === "text/csv" ||
    resolved.includes("spreadsheet") ||
    resolved.includes("excel")
  ) {
    return (
      <FileSpreadsheetIcon
        className={cn("text-emerald-500 shrink-0", className)}
        size={size}
      />
    );
  }

  if (
    resolved === "application/json" ||
    resolved === "text/javascript" ||
    resolved === "text/typescript" ||
    resolved === "text/html" ||
    resolved === "text/css"
  ) {
    return (
      <FileCodeIcon
        className={cn("text-cyan-500 shrink-0", className)}
        size={size}
      />
    );
  }

  return (
    <FileIcon
      className={cn("text-muted-foreground shrink-0", className)}
      size={size}
    />
  );
}
