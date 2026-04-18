import { z } from 'zod';

const serverSchema = z.object({
  API_BASE_URL: z.string().min(1),
  COGNITO_DOMAIN: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  COGNITO_SCOPES: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  COOKIE_DOMAIN: z.string().optional(),
});

export const env = serverSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
  COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_SCOPES: process.env.COGNITO_SCOPES,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
});
