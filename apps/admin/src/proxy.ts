import { NextRequest, NextResponse } from 'next/server';

import {
  AUTH_COOKIES,
  REFRESH_TOKEN_MAX_AGE,
  decodeJwt,
  isTokenExpired,
  userFromPayload,
} from '@workspace/ui/lib/auth';
import { requestCognitoTokens } from '@workspace/ui/lib/auth-server';

import { authCookie, cognito, deletedCookie, hasStaffAccess } from '@/lib/auth';

const PUBLIC_PATH_PREFIXES = ['/login', '/api/auth/'];

const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
};

const redirectToLogin = (request: NextRequest): NextResponse => {
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(AUTH_COOKIES.idToken, '', deletedCookie());
  response.cookies.set(AUTH_COOKIES.accessToken, '', deletedCookie());
  response.cookies.set(AUTH_COOKIES.refreshToken, '', deletedCookie());
  return response;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const idToken = request.cookies.get(AUTH_COOKIES.idToken)?.value;
  const accessToken = request.cookies.get(AUTH_COOKIES.accessToken)?.value;
  const refreshToken = request.cookies.get(AUTH_COOKIES.refreshToken)?.value;

  // A missing access-token cookie (e.g. a session created before the
  // access-token rollout) falls through to the refresh flow below.
  if (idToken && accessToken) {
    const payload = decodeJwt(idToken);
    if (payload && !isTokenExpired(payload)) {
      if (!hasStaffAccess(userFromPayload(payload))) {
        return redirectToLogin(request);
      }
      return NextResponse.next();
    }
  }

  if (refreshToken) {
    const tokens = await requestCognitoTokens(cognito, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    if (tokens?.id_token && tokens.access_token && tokens.expires_in) {
      const payload = decodeJwt(tokens.id_token);
      if (!payload) return redirectToLogin(request);
      if (!hasStaffAccess(userFromPayload(payload))) {
        return redirectToLogin(request);
      }

      const response = NextResponse.next();
      response.cookies.set(
        AUTH_COOKIES.idToken,
        tokens.id_token,
        authCookie(tokens.expires_in)
      );
      response.cookies.set(
        AUTH_COOKIES.accessToken,
        tokens.access_token,
        authCookie(tokens.expires_in)
      );
      if (tokens.refresh_token) {
        response.cookies.set(
          AUTH_COOKIES.refreshToken,
          tokens.refresh_token,
          authCookie(REFRESH_TOKEN_MAX_AGE)
        );
      }
      return response;
    }
  }

  return redirectToLogin(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
