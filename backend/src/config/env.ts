import { z } from "zod";

const envSchema = z.object({
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().positive(),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().positive(),

  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().positive(),
  API_RATE_LIMIT_MAX: z.coerce.number().positive(),

  PASSWORD_RESET_RATE_LIMIT_WINDOW_MS: z.coerce.number().positive(),
  PASSWORD_RESET_RATE_LIMIT_MAX: z.coerce.number().positive(),
});

export const env = envSchema.parse(process.env);