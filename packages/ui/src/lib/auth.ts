import type { AuthUser, UserRole } from '@workspace/ui/lib/utils';

// Cognito session helpers shared by every app that signs in through Cognito
// (web, admin, insight). Pure — safe in `proxy.ts`, route handlers, and tests.
// The cookie *readers* need `next/headers` and live in `auth-server.ts`.

export const AUTH_COOKIES = {
  idToken: 'cognito_id_token',
  accessToken: 'cognito_access_token',
  refreshToken: 'cognito_refresh_token',
  oauthState: 'cognito_oauth_state',
  pkceVerifier: 'cognito_pkce_verifier',
} as const;

/** Refresh tokens are kept for Cognito's default 30-day refresh window. */
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

export type JwtPayload = {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  picture?: string;
  'cognito:groups'?: string[];
  'cognito:username'?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

const base64UrlDecode = (input: string): string => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '='
  );
  const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const decodeJwt = (token: string): JwtPayload | null => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (payload: JwtPayload): boolean => {
  if (typeof payload.exp !== 'number') return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return nowInSeconds >= payload.exp - 30;
};

export const userFromPayload = (payload: JwtPayload): AuthUser => {
  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  const email = typeof payload.email === 'string' ? payload.email : '';
  const nameFromToken = typeof payload.name === 'string' ? payload.name : '';
  const givenName =
    typeof payload.given_name === 'string' ? payload.given_name : '';
  const familyName =
    typeof payload.family_name === 'string' ? payload.family_name : '';
  const preferredUsername =
    typeof payload.preferred_username === 'string'
      ? payload.preferred_username
      : '';
  const username =
    typeof payload['cognito:username'] === 'string'
      ? payload['cognito:username']
      : '';

  const displayName =
    username ||
    nameFromToken ||
    [givenName, familyName].filter(Boolean).join(' ') ||
    preferredUsername ||
    email ||
    'User';

  const avatar = typeof payload.picture === 'string' ? payload.picture : '';
  const groups = Array.isArray(payload['cognito:groups'])
    ? payload['cognito:groups'].filter(
        (group): group is string => typeof group === 'string'
      )
    : [];
  const role: UserRole = groups.includes('pro') ? 'pro' : 'free';

  return {
    sub,
    name: displayName,
    email: email || displayName,
    avatar: avatar || undefined,
    role,
    groups,
  };
};

/**
 * Cookie options for the auth cookies, bound to one app's cookie domain.
 * `authCookie(maxAge)` sets one; `deletedCookie()` expires it.
 */
export const createAuthCookies = (domain: string | undefined) => {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    domain,
  };

  const authCookie = (maxAge: number) => ({ ...base, maxAge });

  return { authCookie, deletedCookie: () => authCookie(0) };
};
