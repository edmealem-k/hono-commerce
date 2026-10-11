"use client";

import { useCallback, useRef, useState } from "react";

export interface UploadSessionInput {
  category: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  visibility?: "private" | "public";
}

export interface UploadSession {
  uploadId: string;
  fileId: string;
  s3Key: string;
  uploadUrl: string;
  expiresAt: string;
  headers: {
    "Content-Type": string;
    "If-None-Match": "*";
  };
}

export interface ConfirmedUpload {
  uploadId: string;
  fileId: string;
  s3Key: string;
  status: "uploaded_unlinked" | "linked";
  actualSize: number;
  contentType: string | null;
}

export interface FileUploadClient {
  createUploadSession: (input: UploadSessionInput) => Promise<UploadSession>;
  confirmUpload: (uploadId: string) => Promise<ConfirmedUpload>;
  reportUploadFailure: (uploadId: string, reason: string) => Promise<void>;
}

export type FileUploadState =
  | { status: "idle"; file: File | null; error: null }
  | { status: "uploading"; file: File; progress: number; error: null }
  | { status: "success"; file: File; upload: ConfirmedUpload; error: null }
  | { status: "canceled"; file: File | null; error: null }
  | { status: "error"; file: File | null; error: string };

export interface UseFileUploadOptions {
  client: FileUploadClient;
  category: string;
  visibility?: "private" | "public";
  maxFileSize?: number;
  accept?: string;
  prepareFile?: (file: File) => Promise<File | null>;
  onSuccess?: (upload: ConfirmedUpload, file: File) => void | Promise<void>;
  onError?: (message: string) => void;
}

export function useFileUpload({
  client,
  category,
  visibility = "private",
  maxFileSize,
  accept,
  prepareFile,
  onSuccess,
  onError,
}: UseFileUploadOptions) {
  const [state, setState] = useState<FileUploadState>({
    status: "idle",
    file: null,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const uploadIdRef = useRef<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (maxFileSize !== undefined && file.size > maxFileSize) {
        const message = `File exceeds the ${maxFileSize}-byte limit`;
        setState({ status: "error", file, error: message });
        onError?.(message);
        return;
      }

      if (accept && !acceptsFile(file, accept)) {
        const message = "This file type is not accepted";
        setState({ status: "error", file, error: message });
        onError?.(message);
        return;
      }

      let uploadCandidate = file;
      if (prepareFile) {
        const prepared = await prepareFile(file);
        if (!prepared) {
          setState({ status: "canceled", file, error: null });
          return;
        }
        uploadCandidate = prepared;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setState({
        status: "uploading",
        file: uploadCandidate,
        progress: 0,
        error: null,
      });

      try {
        const session = await client.createUploadSession({
          category,
          fileName: uploadCandidate.name,
          contentType: uploadCandidate.type || "application/octet-stream",
          fileSize: uploadCandidate.size,
          visibility,
        });
        uploadIdRef.current = session.uploadId;

        await putFileToS3(
          session,
          uploadCandidate,
          controller.signal,
          (progress) => {
            setState({
              status: "uploading",
              file: uploadCandidate,
              progress,
              error: null,
            });
          },
        );

        const confirmed = await client.confirmUpload(session.uploadId);
        setState({
          status: "success",
          file: uploadCandidate,
          upload: confirmed,
          error: null,
        });
        await onSuccess?.(confirmed, uploadCandidate);
      } catch (error) {
        const message = controller.signal.aborted
          ? "Upload canceled"
          : error instanceof Error
            ? error.message
            : "Failed to upload file";

        if (controller.signal.aborted) {
          setState({ status: "canceled", file: uploadCandidate, error: null });
        } else {
          setState({ status: "error", file: uploadCandidate, error: message });
          onError?.(message);
          try {
            if (uploadIdRef.current) {
              await client.reportUploadFailure(uploadIdRef.current, message);
            }
          } catch {
            // The original upload error is the actionable client error.
          }
        }
      } finally {
        abortRef.current = null;
        uploadIdRef.current = null;
      }
    },
    [
      accept,
      category,
      client,
      maxFileSize,
      onError,
      onSuccess,
      prepareFile,
      visibility,
    ],
  );

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ status: "idle", file: null, error: null });
  }, []);

  return {
    state,
    uploadFile,
    cancelUpload,
    reset,
    uploading: state.status === "uploading",
  };
}

function putFileToS3(
  session: UploadSession,
  file: File,
  signal: AbortSignal,
  onProgress: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", session.uploadUrl);
    request.setRequestHeader("Content-Type", session.headers["Content-Type"]);
    request.setRequestHeader("If-None-Match", session.headers["If-None-Match"]);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${request.status}`));
      }
    });
    request.addEventListener("error", () =>
      reject(new Error("S3 upload failed")),
    );
    request.addEventListener("abort", () =>
      reject(new Error("Upload canceled")),
    );
    signal.addEventListener("abort", () => request.abort(), { once: true });
    request.send(file);
  });
}

function acceptsFile(file: File, accept: string) {
  return accept
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule === "*" || rule === "*/*") return true;
      if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
      if (rule.endsWith("/*"))
        return file.type.toLowerCase().startsWith(rule.slice(0, -1));
      return file.type.toLowerCase() === rule;
    });
}
