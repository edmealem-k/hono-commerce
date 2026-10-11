"use client";

import { Alert, AlertDescription } from "@hono-commerce/ui/components/alert";
import { Button } from "@hono-commerce/ui/components/button";
import { Spinner } from "@hono-commerce/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@hono-commerce/ui/components/table";
import { cn } from "@hono-commerce/ui/lib/utils";
import { DownloadIcon, FileIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { inferMimeType, MimeIcon } from "../mime-icon";

export interface FileRendererProps {
  url: string;
  mimeType?: string | null;
  fileName?: string | null;
  className?: string;
  onDownload?: () => void;
  maxRows?: number;
}

export function FileRenderer({
  url,
  mimeType,
  fileName,
  className,
  onDownload,
  maxRows = 200,
}: FileRendererProps) {
  const resolvedType = inferMimeType(mimeType, fileName || url);

  if (resolvedType === "text/csv") {
    return <CsvRenderer url={url} maxRows={maxRows} className={className} />;
  }
  if (resolvedType === "application/pdf") {
    return (
      <iframe
        src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
        className={cn(
          "size-full min-h-[400px] rounded-md border-0 bg-background",
          className,
        )}
        title={fileName || "PDF Document Preview"}
      />
    );
  }
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
  if (
    resolvedType.startsWith("text/") ||
    resolvedType === "application/json" ||
    resolvedType === "application/xml"
  ) {
    return <TextFileRenderer url={url} className={className} />;
  }
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

function TextFileRenderer({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "success"; content: string }
    | { status: "error"; message: string }
  >({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    void fetch(url)
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load text file preview");
        return response.text();
      })
      .then((content) => {
        if (!cancelled)
          setState({ status: "success", content: content.slice(0, 50000) });
      })
      .catch((error) => {
        if (!cancelled)
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Failed to load preview",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  if (state.status === "loading")
    return (
      <div className="text-muted-foreground flex size-full items-center justify-center gap-2 p-6 text-sm">
        <Spinner /> Loading document preview…
      </div>
    );
  if (state.status === "error")
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  return (
    <pre
      className={cn(
        "size-full overflow-auto bg-muted/20 p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap",
        className,
      )}
    >
      {state.content}
    </pre>
  );
}

function CsvRenderer({
  url,
  maxRows,
  className,
}: {
  url: string;
  maxRows: number;
  className?: string;
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | {
        status: "success";
        headers: string[];
        rows: string[][];
        truncated: boolean;
      }
    | { status: "error"; message: string }
  >({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    void fetch(url)
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load CSV file");
        return response.text();
      })
      .then((text) => {
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length === 0) throw new Error("CSV file is empty");
        const delimiter = lines[0]?.includes(";") ? ";" : ",";
        const headers = parseCsvLine(lines[0] ?? "", delimiter);
        const allRows = lines
          .slice(1)
          .map((line) => parseCsvLine(line, delimiter));
        if (!cancelled)
          setState({
            status: "success",
            headers,
            rows: allRows.slice(0, maxRows),
            truncated: allRows.length > maxRows,
          });
      })
      .catch((error) => {
        if (!cancelled)
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to load CSV file",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [maxRows, url]);
  if (state.status === "loading")
    return (
      <div className="text-muted-foreground flex size-full items-center justify-center gap-2 p-6 text-sm">
        <Spinner /> Loading CSV preview…
      </div>
    );
  if (state.status === "error")
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  return (
    <div className={cn("size-full overflow-auto p-4", className)}>
      {state.truncated ? (
        <p className="text-muted-foreground mb-2 text-xs">
          Showing the first {maxRows} rows.
        </p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            {state.headers.map((header, index) => (
              <TableHead key={`${header}-${index}`}>
                {header || `Column ${index + 1}`}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={Math.max(state.headers.length, 1)}
                className="text-muted-foreground text-center"
              >
                No data rows found
              </TableCell>
            </TableRow>
          ) : (
            state.rows.map((row, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {state.headers.map((_, columnIndex) => (
                  <TableCell key={`cell-${rowIndex}-${columnIndex}`}>
                    {row[columnIndex] || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (const character of line) {
    if (character === '"') quoted = !quoted;
    else if (character === delimiter && !quoted) {
      values.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else current += character;
  }
  values.push(current.trim().replace(/^"|"$/g, ""));
  return values;
}
