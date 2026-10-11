import type { PaginationMeta, ValidationIssue } from "@hono-commerce/types";

export interface OkOptions<T = undefined> {
  data?: T;
  message?: string;
}

export interface PaginatedOptions<T> {
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

export interface FailOptions {
  error: string;
  code: string;
  issues?: ValidationIssue[];
}

/**
 * 1. Single entity, composite query, or action confirmation (HTTP 200/201)
 */
export function ok<T = undefined>(options: OkOptions<T>) {
  return {
    success: true as const,
    ...(options.data !== undefined ? { data: options.data } : {}),
    ...(options.message ? { message: options.message } : {}),
  };
}

/**
 * 2. Paginated list query (HTTP 200)
 */
export function paginated<T>(options: PaginatedOptions<T>) {
  return {
    success: true as const,
    data: options.data,
    meta: options.meta,
    ...(options.message ? { message: options.message } : {}),
  };
}

/**
 * 3. Error response (HTTP 4xx/5xx)
 */
export function fail(options: FailOptions) {
  return {
    success: false as const,
    error: options.error,
    code: options.code,
    ...(options.issues && options.issues.length > 0
      ? { issues: options.issues }
      : {}),
  };
}
