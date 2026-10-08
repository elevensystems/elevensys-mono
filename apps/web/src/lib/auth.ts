import { createAuthCookies, userFromPayload } from '@workspace/ui/lib/auth';
import { type CognitoConfig, getSession } from '@workspace/ui/lib/auth-server';
import type { AuthUser } from '@workspace/ui/lib/utils';

import { env } from '@/env';

export const cognito: CognitoConfig = {
  domain: env.COGNITO_DOMAIN,
  clientId: env.COGNITO_CLIENT_ID,
  scopes: env.COGNITO_SCOPES,
  appUrl: env.NEXT_PUBLIC_APP_URL,
};

export const { authCookie, deletedCookie } = createAuthCookies(
  env.COOKIE_DOMAIN
);

export const getUserFromSession = async (): Promise<AuthUser | null> => {
  const { payload, expired } = await getSession();
  if (!payload || expired) return null;
  return userFromPayload(payload);
};
