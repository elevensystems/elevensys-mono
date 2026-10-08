/**
 * @jest-environment node
 */
import { createHash } from 'node:crypto';

import { createAuthCookies } from '@workspace/ui/lib/auth';
import {
  cognitoLogoutUrl,
  redirectToCognito,
  requestCognitoTokens,
} from '@workspace/ui/lib/auth-server';

const config = {
  domain: 'https://auth.example.com',
  clientId: 'client-1',
  scopes: 'openid email',
  appUrl: 'https://app.example.com/',
};

const { authCookie } = createAuthCookies(undefined);

describe('redirectToCognito', () => {
  it('redirects with an S256 challenge matching the stored verifier', async () => {
    const response = await redirectToCognito(
      config,
      'oauth2/authorize',
      authCookie
    );
    const location = new URL(response.headers.get('location')!);
    const verifier = response.cookies.get('cognito_pkce_verifier')!.value;
    const state = response.cookies.get('cognito_oauth_state')!.value;

    expect(location.origin + location.pathname).toBe(
      'https://auth.example.com/oauth2/authorize'
    );
    expect(location.searchParams.get('redirect_uri')).toBe(
      'https://app.example.com/api/auth/callback'
    );
    expect(location.searchParams.get('state')).toBe(state);
    expect(location.searchParams.get('code_challenge')).toBe(
      createHash('sha256').update(verifier).digest('base64url')
    );
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{86}$/);
  });
});

describe('requestCognitoTokens', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    global.fetch = fetchMock;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns the tokens Cognito issues', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id_token: 'id', expires_in: 60 }))
    );
    const tokens = await requestCognitoTokens(config, {
      grant_type: 'refresh_token',
      refresh_token: 'r',
    });

    expect(tokens).toEqual({ id_token: 'id', expires_in: 60 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://auth.example.com/oauth2/token');
    expect(init.body).toBe(
      'client_id=client-1&grant_type=refresh_token&refresh_token=r'
    );
  });

  it('returns null when Cognito rejects the grant or is unreachable', async () => {
    fetchMock.mockResolvedValueOnce(new Response('bad', { status: 400 }));
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const grant = { grant_type: 'refresh_token', refresh_token: 'r' } as const;

    expect(await requestCognitoTokens(config, grant)).toBeNull();
    expect(await requestCognitoTokens(config, grant)).toBeNull();
  });
});

it('builds the hosted-UI logout URL', () => {
  expect(cognitoLogoutUrl(config, '/login')).toBe(
    'https://auth.example.com/logout?client_id=client-1&logout_uri=https%3A%2F%2Fapp.example.com%2Flogin'
  );
});
