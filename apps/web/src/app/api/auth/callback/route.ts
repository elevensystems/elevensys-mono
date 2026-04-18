import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/env';
import { AUTH_COOKIES } from '@/lib/auth';
import { authCookie, deletedCookie } from '@/lib/auth-cookies';

type TokenResponse = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export const GET = async (request: NextRequest) => {
  const cognitoDomain = env.COGNITO_DOMAIN;
  const clientId = env.COGNITO_CLIENT_ID;
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

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

  const redirectUri = `${appUrl}/api/auth/callback`;

  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const tokenResponse = await fetch(`${cognitoDomain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams.toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Cognito token exchange failed:', errorText);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 400 }
    );
  }

  const tokenJson = (await tokenResponse.json()) as TokenResponse;

  if (!tokenJson.id_token || !tokenJson.refresh_token) {
    return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
  }

  const response = NextResponse.redirect(new URL('/', request.url));

  response.cookies.set(
    AUTH_COOKIES.idToken,
    tokenJson.id_token,
    authCookie(tokenJson.expires_in)
  );

  response.cookies.set(
    AUTH_COOKIES.refreshToken,
    tokenJson.refresh_token,
    authCookie(60 * 60 * 24 * 30)
  );

  // Clear transient OAuth cookies.
  response.cookies.set(AUTH_COOKIES.oauthState, '', deletedCookie());
  response.cookies.set(AUTH_COOKIES.pkceVerifier, '', deletedCookie());

  return response;
};
