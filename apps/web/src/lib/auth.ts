import { cookies } from 'next/headers';

import type { AuthUser, JwtPayload, UserRole } from '@/types/auth';

export const AUTH_COOKIES = {
  idToken: 'cognito_id_token',
  refreshToken: 'cognito_refresh_token',
  oauthState: 'cognito_oauth_state',
  pkceVerifier: 'cognito_pkce_verifier',
} as const;

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

// Server-only helpers for reading the current session from HttpOnly cookies.
export const getIdToken = async (): Promise<string | null> => {
  return (await cookies()).get(AUTH_COOKIES.idToken)?.value ?? null;
};

export const getRefreshToken = async (): Promise<string | null> => {
  return (await cookies()).get(AUTH_COOKIES.refreshToken)?.value ?? null;
};

export const getSession = async () => {
  const idToken = await getIdToken();
  const refreshToken = await getRefreshToken();
  const payload = idToken ? decodeJwt(idToken) : null;
  const expired = payload ? isTokenExpired(payload) : true;
  return { idToken, refreshToken, payload, expired };
};

export const getUserFromSession = async (): Promise<AuthUser | null> => {
  const { payload, expired } = await getSession();
  if (!payload || expired) return null;

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
