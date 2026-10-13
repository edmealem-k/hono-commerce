import { z } from "zod";

export const magicLinkSignInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export type MagicLinkSignInInput = z.infer<typeof magicLinkSignInSchema>;
