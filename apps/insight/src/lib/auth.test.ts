import { isTokenExpired, userFromPayload } from './auth';

describe('isTokenExpired', () => {
  it('returns false for a future expiry', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    expect(isTokenExpired({ exp: futureExp })).toBe(false);
  });

  it('returns true for a past expiry', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 1;
    expect(isTokenExpired({ exp: pastExp })).toBe(true);
  });

  it('returns true when exp is missing', () => {
    expect(isTokenExpired({})).toBe(true);
  });
});

describe('userFromPayload', () => {
  it('builds a user from a full payload', () => {
    const payload = {
      sub: 'u1',
      email: 'user@example.com',
      'cognito:username': 'myuser',
      'cognito:groups': ['pro'],
    };
    const user = userFromPayload(payload);
    expect(user.sub).toBe('u1');
    expect(user.email).toBe('user@example.com');
    expect(user.name).toBe('myuser');
    expect(user.role).toBe('pro');
  });

  it('defaults to free role when not in pro group', () => {
    const user = userFromPayload({ sub: 'u2', email: 'x@y.com' });
    expect(user.role).toBe('free');
  });

  it('falls back to email when no username fields are present', () => {
    const user = userFromPayload({ sub: 'u3', email: 'fallback@example.com' });
    expect(user.name).toBe('fallback@example.com');
  });

  it('prefers cognito:username over given/family name', () => {
    const user = userFromPayload({
      sub: 'u4',
      email: 'x@y.com',
      'cognito:username': 'coguser',
      given_name: 'First',
      family_name: 'Last',
    });
    expect(user.name).toBe('coguser');
  });

  it('falls back to given + family name when no username', () => {
    const user = userFromPayload({
      sub: 'u5',
      email: 'x@y.com',
      given_name: 'First',
      family_name: 'Last',
    });
    expect(user.name).toBe('First Last');
  });
});
