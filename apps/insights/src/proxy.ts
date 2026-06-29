import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/env';
import {
  AUTH_COOKIES,
  decodeJwt,
  isTokenExpired,
  userFromPayload,
} from '@/lib/auth';

const PUBLIC_PATHS = ['/'];
const PUBLIC_PATH_PREFIXES = ['/login', '/api/auth/'];

const isPublicPath = (pathname: string): boolean => {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
};

type TokenResponse = {
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

async function refreshTokens(
  refreshToken: string
): Promise<TokenResponse | null> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: env.COGNITO_CLIENT_ID,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${env.COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) return null;
  return (await res.json()) as TokenResponse;
}

const isSecure = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
  httpOnly: true,
  secure: isSecure,
  sameSite: 'lax' as const,
  path: '/',
  domain: env.COOKIE_DOMAIN,
};

const redirectToLogin = (request: NextRequest): NextResponse => {
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(AUTH_COOKIES.idToken, '', {
    ...baseCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(AUTH_COOKIES.refreshToken, '', {
    ...baseCookieOptions,
    maxAge: 0,
  });
  return response;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const idToken = request.cookies.get(AUTH_COOKIES.idToken)?.value;
  const refreshToken = request.cookies.get(AUTH_COOKIES.refreshToken)?.value;

  if (idToken) {
    const payload = decodeJwt(idToken);
    if (payload && !isTokenExpired(payload)) {
      const user = userFromPayload(payload);
      if (!user.groups.includes(env.COGNITO_REQUIRED_GROUP)) {
        return redirectToLogin(request);
      }
      return NextResponse.next();
    }
  }

  if (refreshToken) {
    const tokens = await refreshTokens(refreshToken);
    if (tokens?.id_token && tokens.expires_in) {
      const payload = decodeJwt(tokens.id_token);
      if (!payload) return redirectToLogin(request);
      const user = userFromPayload(payload);
      if (!user.groups.includes(env.COGNITO_REQUIRED_GROUP)) {
        return redirectToLogin(request);
      }

      const response = NextResponse.next();
      response.cookies.set(AUTH_COOKIES.idToken, tokens.id_token, {
        ...baseCookieOptions,
        maxAge: tokens.expires_in,
      });
      if (tokens.refresh_token) {
        response.cookies.set(AUTH_COOKIES.refreshToken, tokens.refresh_token, {
          ...baseCookieOptions,
          maxAge: 60 * 60 * 24 * 30,
        });
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
