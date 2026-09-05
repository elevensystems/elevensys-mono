import { z } from 'zod';

const serverSchema = z.object({
  API_BASE_URL: z.string().min(1),
  COGNITO_DOMAIN: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  COGNITO_SCOPES: z.string().min(1),
  COGNITO_REQUIRED_GROUP: z.string().min(1).default('staff'),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  COOKIE_DOMAIN: z.string().optional(),

  // Site banner editor. All optional so the app still boots without a Global
  // Config store; the editor reports the missing pieces instead of crashing.
  // Vercel injects EDGE_CONFIG when a store is connected; GLOBAL_CONFIG is the
  // newer name for the same connection string.
  GLOBAL_CONFIG: z.string().optional(),
  EDGE_CONFIG: z.string().optional(),
  VERCEL_API_TOKEN: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
});

export const env = serverSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
  COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_SCOPES: process.env.COGNITO_SCOPES,
  COGNITO_REQUIRED_GROUP: process.env.COGNITO_REQUIRED_GROUP,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  GLOBAL_CONFIG: process.env.GLOBAL_CONFIG,
  EDGE_CONFIG: process.env.EDGE_CONFIG,
  VERCEL_API_TOKEN: process.env.VERCEL_API_TOKEN,
  VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
});
