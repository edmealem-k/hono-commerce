import { zValidator as honoZValidator } from "@hono/zod-validator";

import { fail } from "../response";

import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";

/**
 * Standardized Zod validator middleware that automatically formats
 * validation failures into the monorepo's unified error envelope:
 * { success: false, error: "Validation failed", code: "VALIDATION_ERROR", issues: [...] }
 */
export function validated<
  Target extends keyof ValidationTargets,
  T extends ZodType,
>(target: Target, schema: T) {
  return honoZValidator(target, schema, (result, c) => {
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));

      return c.json(
        fail({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          issues,
        }),
        400,
      );
    }
  });
}
