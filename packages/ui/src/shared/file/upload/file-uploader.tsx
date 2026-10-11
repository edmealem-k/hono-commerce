"use client";

import { Alert, AlertDescription } from "@hono-commerce/ui/components/alert";
import { Button } from "@hono-commerce/ui/components/button";
import { Input } from "@hono-commerce/ui/components/input";
import { Progress } from "@hono-commerce/ui/components/progress";
import { cn } from "@hono-commerce/ui/lib/utils";
import {
  FileUpIcon,
  RotateCcwIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { useRef } from "react";

import {
  useFileUpload,
  type ConfirmedUpload,
  type FileUploadClient,
} from "./use-file-upload";

export interface FileUploaderProps {
  client: FileUploadClient;
  category: string;
  accept?: string;
  maxFileSize?: number;
  prepareFile?: (file: File) => Promise<File | null>;
  visibility?: "private" | "public";
  title?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  onSuccess?: (upload: ConfirmedUpload, file: File) => void | Promise<void>;
  onError?: (message: string) => void;
}

export function FileUploader({
  client,
  category,
  accept,
  maxFileSize,
  prepareFile,
  visibility = "private",
  title = "Upload file",
  description = "Choose a file or drag it here",
  disabled = false,
  className,
  onSuccess,
  onError,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { state, uploadFile, cancelUpload, reset, uploading } = useFileUpload({
    client,
    category,
    accept,
    maxFileSize,
    prepareFile,
    visibility,
    onSuccess,
    onError,
  });

  const chooseFile = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void uploadFile(file);
        }}
      />

      {state.status === "idle" || state.status === "canceled" ? (
        <Button
          type="button"
          variant="outline"
          className="border-border bg-card text-foreground hover:border-primary/50 flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-dashed p-5 text-center"
          disabled={disabled}
          onClick={chooseFile}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file && !disabled) void uploadFile(file);
          }}
        >
          <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
            <UploadCloudIcon className="size-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium">{title}</span>
          <span className="text-muted-foreground text-xs">{description}</span>
        </Button>
      ) : null}

      {state.status === "uploading" ? (
        <div className="border-border bg-card space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <FileUpIcon className="text-primary size-4" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {state.file.name}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {state.progress}%
            </span>
          </div>
          <Progress value={state.progress} aria-label="Upload progress" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cancelUpload}
          >
            <XIcon className="size-3.5" aria-hidden="true" />
            Cancel
          </Button>
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="border-border bg-card flex items-center gap-3 rounded-lg border p-4">
          <FileUpIcon className="size-4 text-emerald-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{state.file.name}</p>
            <p className="text-muted-foreground text-xs">Upload verified</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={reset}
            aria-label="Remove uploaded file"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{state.error}</span>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              <RotateCcwIcon className="size-3.5" aria-hidden="true" />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
