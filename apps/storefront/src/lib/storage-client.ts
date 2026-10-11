import { api } from "./api-client";

import type {
  AttachFileInput,
  CreateUploadSessionInput,
  DeleteFileQuery,
  FileIdParam,
} from "@hono-commerce/types";

export function createStorageClient() {
  return {
    async createUploadSession(input: CreateUploadSessionInput) {
      const response = await api.storage["upload-url"].$post({ json: input });
      const body = await response.json();
      if (!body.success || !body.data)
        throw new Error("Storage request failed");
      return body.data;
    },
    async confirmUpload(uploadId: string) {
      const response = await api.storage.uploads[":uploadId"].confirm.$post({
        param: { uploadId },
      });
      const body = await response.json();
      if (!body.success || !body.data)
        throw new Error("Storage request failed");
      return body.data;
    },
    async reportUploadFailure(uploadId: string, reason: string) {
      const response = await api.storage.uploads.fail.$post({
        json: { uploadId, reason },
      });
      if (!response.ok) throw new Error("Failed to report upload failure");
    },
    async getPreviewUrl(input: FileIdParam & Partial<AttachFileInput>) {
      const response = await api.storage["preview-url"].$get({
        query: input,
      });
      const body = await response.json();
      if (!body.success || !body.data)
        throw new Error("Storage request failed");
      return body.data;
    },
    async attachFile(fileId: string, input: AttachFileInput) {
      const response = await api.storage.files[":fileId"].links.$post({
        param: { fileId },
        json: input,
      });
      if (!response.ok) throw new Error("Failed to attach file");
    },
    async detachFile(fileId: string, input: AttachFileInput) {
      const response = await api.storage.files[":fileId"].links.$delete({
        param: { fileId },
        json: input,
      });
      if (!response.ok) throw new Error("Failed to detach file");
    },
    async deleteFile(fileId: string, query?: DeleteFileQuery) {
      const response = await api.storage.files[":fileId"].$delete({
        param: { fileId },
        query: { permanent: query?.permanent ? "true" : "false" },
      });
      if (!response.ok) throw new Error("Failed to delete file");
    },
  };
}
