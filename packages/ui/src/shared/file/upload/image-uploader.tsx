"use client";

import { Button } from "@hono-commerce/ui/components/button";
import { cn } from "@hono-commerce/ui/lib/utils";
import { ImageIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FileUploader } from "./file-uploader";
import { ImageCropper } from "./image-cropper";

import type { ConfirmedUpload, FileUploadClient } from "./use-file-upload";

export interface ImageUploaderProps {
  client: FileUploadClient;
  category: string;
  currentUrl?: string | null;
  maxFileSize?: number;
  visibility?: "private" | "public";
  title?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  prepareFile?: (file: File) => Promise<File | null>;
  enableCrop?: boolean;
  cropAspect?: number;
  cropOutputWidth?: number;
  cropOutputHeight?: number;
  onSuccess?: (upload: ConfirmedUpload, file: File) => void | Promise<void>;
  onError?: (message: string) => void;
}

export function ImageUploader({
  client,
  category,
  currentUrl,
  maxFileSize,
  visibility = "private",
  title = "Upload image",
  description = "PNG, JPG, GIF, SVG, or WebP",
  disabled = false,
  className,
  prepareFile,
  enableCrop = false,
  cropAspect = 1,
  cropOutputWidth = 800,
  cropOutputHeight = 800,
  onSuccess,
  onError,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentUrl ?? null,
  );
  const [cropFile, setCropFile] = useState<File | null>(null);
  const cropResolver = useRef<((file: File | null) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSuccess = async (upload: ConfirmedUpload, file: File) => {
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl((previous) => {
      if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
      return nextUrl;
    });
    await onSuccess?.(upload, file);
  };

  const prepareImage = async (file: File) => {
    const prepared = enableCrop ? await requestCrop(file) : file;
    return prepared ? (prepareFile ? prepareFile(prepared) : prepared) : null;
  };

  const requestCrop = (file: File) =>
    new Promise<File | null>((resolve) => {
      cropResolver.current = resolve;
      setCropFile(file);
    });

  const cancelCrop = () => {
    cropResolver.current?.(null);
    cropResolver.current = null;
    setCropFile(null);
  };

  const confirmCrop = (file: File) => {
    cropResolver.current?.(file);
    cropResolver.current = null;
    setCropFile(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {previewUrl ? (
        <div className="border-border bg-card relative overflow-hidden rounded-lg border p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Selected upload preview"
            className="max-h-72 w-full rounded-md object-contain"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="absolute top-3 right-3"
            onClick={() => setPreviewUrl(null)}
            aria-label="Clear image preview"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <ImageIcon className="size-4" aria-hidden="true" /> No image selected
        </div>
      )}
      <FileUploader
        client={client}
        category={category}
        accept="image/*"
        maxFileSize={maxFileSize}
        visibility={visibility}
        title={title}
        description={description}
        disabled={disabled}
        prepareFile={prepareImage}
        onSuccess={handleSuccess}
        onError={onError}
      />
      <ImageCropper
        file={cropFile}
        aspect={cropAspect}
        outputWidth={cropOutputWidth}
        outputHeight={cropOutputHeight}
        onConfirm={confirmCrop}
        onCancel={cancelCrop}
      />
    </div>
  );
}
