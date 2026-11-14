import 'dotenv/config';
import { z } from 'zod';

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3001),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid Supabase project URL'),
  SUPABASE_ANON_KEY: z.string().min(20, 'SUPABASE_ANON_KEY is required (anon/publishable key)'),
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(1).default('gemini-2.5-flash')
  ),
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  console.error(`\n[SignalDesk] Invalid environment configuration:\n${details}\n`);
  console.error('Copy server/.env.example to server/.env and fill in the required values.\n');
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isGeminiConfigured = Boolean(env.GEMINI_API_KEY);
export const isEmailConfigured = Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL);
