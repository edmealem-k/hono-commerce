"use client";

import { useEffect, useState } from "react";

export interface S3UrlState {
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useS3Url(
  s3Key: string | undefined | null,
  getReadSignedUrl?: (key: string) => Promise<string | null>,
): S3UrlState {
  const [state, setState] = useState<S3UrlState>({
    url: null,
    isLoading: Boolean(s3Key),
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadUrl() {
      if (!s3Key) {
        setState({ url: null, isLoading: false, error: null });
        return;
      }

      if (
        s3Key.startsWith("http://") ||
        s3Key.startsWith("https://") ||
        s3Key.startsWith("blob:")
      ) {
        setState({ url: s3Key, isLoading: false, error: null });
        return;
      }

      if (!getReadSignedUrl) {
        setState({
          url: null,
          isLoading: false,
          error: "A signed URL resolver is required for private files",
        });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const signedUrl = await getReadSignedUrl(s3Key);
        if (!cancelled) {
          setState({ url: signedUrl, isLoading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            url: null,
            isLoading: false,
            error:
              err instanceof Error
                ? err.message
                : "Failed to load signed S3 URL",
          });
        }
      }
    }

    void loadUrl();

    return () => {
      cancelled = true;
    };
  }, [s3Key, getReadSignedUrl]);

  return state;
}
