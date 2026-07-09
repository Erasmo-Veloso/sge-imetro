import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  WEB_URL: z.string().url().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage'),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().email().default('no-reply@imetro.ao'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  QR_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(600),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, string | undefined>): EnvConfig {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}
