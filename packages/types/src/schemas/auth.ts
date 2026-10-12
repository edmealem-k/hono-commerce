import { z } from "zod";

export const magicLinkSignInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  name: z.string().trim().max(120, "Name is too long").optional(),
});

export type MagicLinkSignInInput = z.infer<typeof magicLinkSignInSchema>;
