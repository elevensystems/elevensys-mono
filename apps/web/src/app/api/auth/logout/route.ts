import { NextResponse } from 'next/server';

import { AUTH_COOKIES } from '@workspace/ui/lib/auth';
import { cognitoLogoutUrl } from '@workspace/ui/lib/auth-server';

import { cognito, deletedCookie } from '@/lib/auth';

export const GET = async () => {
  const response = NextResponse.redirect(cognitoLogoutUrl(cognito));

  response.cookies.set(AUTH_COOKIES.idToken, '', deletedCookie());
  response.cookies.set(AUTH_COOKIES.refreshToken, '', deletedCookie());

  return response;
};
