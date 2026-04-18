import { NextResponse } from 'next/server';

import crypto from 'node:crypto';

import { env } from '@/env';
import { AUTH_COOKIES } from '@/lib/auth';
import { authCookie } from '@/lib/auth-cookies';

const base64UrlEncode = (buffer: Buffer): string => {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const createCodeVerifier = (): string => {
  return base64UrlEncode(crypto.randomBytes(64));
};

const createCodeChallenge = (verifier: string): string => {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
};

export const GET = async () => {
  const cognitoDomain = env.COGNITO_DOMAIN;
  const clientId = env.COGNITO_CLIENT_ID;
  const scopes = env.COGNITO_SCOPES;
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

  const redirectUri = `${appUrl}/api/auth/callback`;
  const state = base64UrlEncode(crypto.randomBytes(32));

  // PKCE: generate verifier + challenge (S256).
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const response = NextResponse.redirect(
    `${cognitoDomain}/oauth2/authorize?${params.toString()}`
  );

  response.cookies.set(AUTH_COOKIES.oauthState, state, authCookie(10 * 60));
  response.cookies.set(
    AUTH_COOKIES.pkceVerifier,
    codeVerifier,
    authCookie(10 * 60)
  );

  return response;
};
