import { z } from 'zod';

const serverSchema = z.object({
  API_BASE_URL: z.string().min(1),
});

export const env = serverSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
});
