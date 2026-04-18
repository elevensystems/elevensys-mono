import { NextResponse } from 'next/server';

import { env } from '@/env';
import { AUTH_COOKIES } from '@/lib/auth';
import { deletedCookie } from '@/lib/auth-cookies';

export const GET = async () => {
  const cognitoDomain = env.COGNITO_DOMAIN;
  const clientId = env.COGNITO_CLIENT_ID;
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

  const logoutUrl = new URL(`${cognitoDomain}/logout`);
  logoutUrl.searchParams.set('client_id', clientId);
  logoutUrl.searchParams.set('logout_uri', appUrl);

  const response = NextResponse.redirect(logoutUrl.toString());

  response.cookies.set(AUTH_COOKIES.idToken, '', deletedCookie());
  response.cookies.set(AUTH_COOKIES.refreshToken, '', deletedCookie());

  return response;
};
