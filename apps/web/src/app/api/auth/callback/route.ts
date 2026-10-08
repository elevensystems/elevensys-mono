import { NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIES, REFRESH_TOKEN_MAX_AGE } from '@workspace/ui/lib/auth';
import {
  callbackUrl,
  requestCognitoTokens,
} from '@workspace/ui/lib/auth-server';

import { authCookie, cognito, deletedCookie } from '@/lib/auth';

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get(AUTH_COOKIES.oauthState)?.value;
  const codeVerifier = request.cookies.get(AUTH_COOKIES.pkceVerifier)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 });
  }

  if (!codeVerifier) {
    return NextResponse.json(
      { error: 'Missing PKCE verifier' },
      { status: 400 }
    );
  }

  const tokenJson = await requestCognitoTokens(cognito, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: callbackUrl(cognito),
    code_verifier: codeVerifier,
  });

  if (!tokenJson) {
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 400 }
    );
  }

  if (!tokenJson.id_token || !tokenJson.refresh_token) {
    return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
  }

  const response = NextResponse.redirect(new URL('/', request.url));

  response.cookies.set(
    AUTH_COOKIES.idToken,
    tokenJson.id_token,
    authCookie(tokenJson.expires_in ?? 3600)
  );

  response.cookies.set(
    AUTH_COOKIES.refreshToken,
    tokenJson.refresh_token,
    authCookie(REFRESH_TOKEN_MAX_AGE)
  );

  // Clear transient OAuth cookies.
  response.cookies.set(AUTH_COOKIES.oauthState, '', deletedCookie());
  response.cookies.set(AUTH_COOKIES.pkceVerifier, '', deletedCookie());

  return response;
};
