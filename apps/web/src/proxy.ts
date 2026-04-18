import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/env';
import { AUTH_COOKIES, decodeJwt, isTokenExpired } from '@/lib/auth';
import { authCookie, deletedCookie } from '@/lib/auth-cookies';
import {
  getTenantConfig,
  resolveTenantFromHostname,
} from '@/lib/domain-config';

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password'];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

async function refreshTokens(refreshToken: string): Promise<{
  id_token: string;
  refresh_token?: string;
  expires_in: number;
} | null> {
  const cognitoDomain = env.COGNITO_DOMAIN;
  const clientId = env.COGNITO_CLIENT_ID;

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    });

    const res = await fetch(`${cognitoDomain}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.id_token) return null;

    return {
      id_token: data.id_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in ?? 3600,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const tenant = resolveTenantFromHostname(hostname);
  const config = getTenantConfig(tenant);
  const { pathname } = request.nextUrl;

  // Block routes that are restricted for this tenant
  const isBlocked = config.blockedRoutes.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isBlocked) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Forward tenant key and pathname to layouts via request headers.
  // Both are deleted before being set to prevent spoofing from callers
  // that can reach the origin directly.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-tenant');
  requestHeaders.set('x-tenant', tenant);
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
     * - api routes (no tenant scoping needed)
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
  const tokens = await refreshTokens(refreshToken);

  if (tokens) {
    const newPayload = decodeJwt(tokens.id_token);
    if (newPayload && !isTokenExpired(newPayload)) {
      const response = isAuthRoute(pathname)
        ? NextResponse.redirect(new URL('/', request.url))
        : NextResponse.next({ request: { headers: requestHeaders } });

      response.cookies.set(
        AUTH_COOKIES.idToken,
        tokens.id_token,
        authCookie(tokens.expires_in)
      );

      if (tokens.refresh_token) {
        response.cookies.set(
          AUTH_COOKIES.refreshToken,
          tokens.refresh_token,
          authCookie(60 * 60 * 24 * 30)
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
