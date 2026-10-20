import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const getEnv = (): Env => {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
  });

  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }

  return parsed.data;
};
