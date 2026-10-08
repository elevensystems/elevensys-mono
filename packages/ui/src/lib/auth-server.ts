import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  AUTH_COOKIES,
  decodeJwt,
  isTokenExpired,
} from '@workspace/ui/lib/auth';

// Cognito OAuth2 (PKCE) plumbing shared by web, admin, and insight. Each app
// binds its own env into a `CognitoConfig` and keeps only its access rules.

export interface CognitoConfig {
  domain: string;
  clientId: string;
  scopes: string;
  /** The app's public origin; a trailing slash is tolerated. */
  appUrl: string;
}

export interface CognitoTokens {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

type AuthCookie = (maxAge: number) => object;

/** How long the OAuth state and PKCE verifier survive the round trip. */
const OAUTH_COOKIE_MAX_AGE = 10 * 60;

const trimSlash = (url: string) => url.replace(/\/$/, '');

export const callbackUrl = (config: CognitoConfig) =>
  `${trimSlash(config.appUrl)}/api/auth/callback`;

const base64UrlEncode = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const randomBase64Url = (size: number) =>
  base64UrlEncode(crypto.getRandomValues(new Uint8Array(size)));

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  );
  return base64UrlEncode(new Uint8Array(hash));
};

/**
 * Redirects to Cognito's hosted UI (`oauth2/authorize` to sign in, `signup` to
 * register) with a fresh PKCE challenge, stashing the state and verifier in
 * short-lived cookies for the callback to check.
 */
export async function redirectToCognito(
  config: CognitoConfig,
  path: 'oauth2/authorize' | 'signup',
  authCookie: AuthCookie
): Promise<NextResponse> {
  const state = randomBase64Url(32);
  const codeVerifier = randomBase64Url(64);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: callbackUrl(config),
    scope: config.scopes,
    state,
    code_challenge: await createCodeChallenge(codeVerifier),
    code_challenge_method: 'S256',
  });

  const response = NextResponse.redirect(
    `${config.domain}/${path}?${params.toString()}`
  );
  response.cookies.set(
    AUTH_COOKIES.oauthState,
    state,
    authCookie(OAUTH_COOKIE_MAX_AGE)
  );
  response.cookies.set(
    AUTH_COOKIES.pkceVerifier,
    codeVerifier,
    authCookie(OAUTH_COOKIE_MAX_AGE)
  );
  return response;
}

/**
 * POSTs one grant to Cognito's token endpoint. Resolves to `null` — after
 * logging why — when Cognito rejects it or cannot be reached.
 */
export async function requestCognitoTokens(
  config: Pick<CognitoConfig, 'domain' | 'clientId'>,
  grant:
    | {
        grant_type: 'authorization_code';
        code: string;
        redirect_uri: string;
        code_verifier: string;
      }
    | { grant_type: 'refresh_token'; refresh_token: string }
): Promise<CognitoTokens | null> {
  try {
    const response = await fetch(`${config.domain}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        ...grant,
      }).toString(),
    });

    if (!response.ok) {
      console.error(
        `Cognito ${grant.grant_type} grant failed:`,
        await response.text()
      );
      return null;
    }
    return (await response.json()) as CognitoTokens;
  } catch (error) {
    console.error(`Cognito ${grant.grant_type} grant failed:`, error);
    return null;
  }
}

/** Cognito's hosted-UI logout, returning the browser to `logoutPath`. */
export const cognitoLogoutUrl = (config: CognitoConfig, logoutPath = '') => {
  const url = new URL(`${config.domain}/logout`);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set(
    'logout_uri',
    `${trimSlash(config.appUrl)}${logoutPath}`
  );
  return url.toString();
};

// Server-only helpers for reading the current session from HttpOnly cookies.
export const getIdToken = async (): Promise<string | null> => {
  return (await cookies()).get(AUTH_COOKIES.idToken)?.value ?? null;
};

// The access token is what gets forwarded to the backend API — the ID token
// stays client-side for identity (OAuth2 convention).
export const getAccessToken = async (): Promise<string | null> => {
  return (await cookies()).get(AUTH_COOKIES.accessToken)?.value ?? null;
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
