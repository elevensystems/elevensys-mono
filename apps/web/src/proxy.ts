import { NextRequest, NextResponse } from 'next/server';

import {
  AUTH_COOKIES,
  REFRESH_TOKEN_MAX_AGE,
  decodeJwt,
  isTokenExpired,
} from '@workspace/ui/lib/auth';
import { requestCognitoTokens } from '@workspace/ui/lib/auth-server';

import { authCookie, cognito, deletedCookie } from '@/lib/auth';

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password'];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward the pathname to layouts via request headers. It is deleted before
  // being set to prevent spoofing from callers that can reach the origin directly.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-pathname');
  requestHeaders.set('x-pathname', pathname);

  // --- Decode JWT once for all checks ---
  const idToken = request.cookies.get(AUTH_COOKIES.idToken)?.value;
  const refreshToken = request.cookies.get(AUTH_COOKIES.refreshToken)?.value;

  const payload = idToken ? decodeJwt(idToken) : null;
  const expired = payload ? isTokenExpired(payload) : true;
  const isAuthenticated = payload !== null && !expired;

  // Redirect authenticated users away from auth pages (sync, no refresh needed).
  if (isAuthenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If no refresh is needed, return early with injected headers.
  if (isAuthenticated || !refreshToken) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Token expired with refresh token available - attempt async refresh.
  return handleTokenRefresh(request, requestHeaders, refreshToken, pathname);
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, assets (public files)
     * - api routes (no pathname header needed)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|assets|api).*)',
  ],
};

async function handleTokenRefresh(
  request: NextRequest,
  requestHeaders: Headers,
  refreshToken: string,
  pathname: string
): Promise<NextResponse> {
  const tokens = await requestCognitoTokens(cognito, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  if (tokens?.id_token) {
    const newPayload = decodeJwt(tokens.id_token);
    if (newPayload && !isTokenExpired(newPayload)) {
      const response = isAuthRoute(pathname)
        ? NextResponse.redirect(new URL('/', request.url))
        : NextResponse.next({ request: { headers: requestHeaders } });

      response.cookies.set(
        AUTH_COOKIES.idToken,
        tokens.id_token,
        authCookie(tokens.expires_in ?? 3600)
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

  // Refresh failed - clear stale cookies.
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.cookies.set(AUTH_COOKIES.idToken, '', deletedCookie());
  response.cookies.set(AUTH_COOKIES.refreshToken, '', deletedCookie());
  return response;
}
