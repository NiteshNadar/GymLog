import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
  console.error('❌ Invalid frontend environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment config');
}

export const env = parsed.data;
