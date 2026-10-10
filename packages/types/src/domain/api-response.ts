/**
 * Standard API Response Contracts
 *
 * Enforces the Type-Safe Discriminated Envelope pattern across all endpoints:
 * - Success: { success: true, data: T, message?: string } or { success: true, data: T[], meta: PaginationMeta }
 * - Error: { success: false, error: string, code: string, issues?: ValidationIssue[] }
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

// 1. Success Envelopes
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

export interface ApiActionResponse {
  success: true;
  message: string;
}

// 2. Error Envelopes
export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  issues?: ValidationIssue[];
}

// 3. Discriminated Union
export type ApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiPaginatedResponse<T>
  | ApiActionResponse
  | ApiErrorResponse;
