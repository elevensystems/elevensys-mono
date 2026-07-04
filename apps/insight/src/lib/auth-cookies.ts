import { env } from '@/env';

const isSecure = process.env.NODE_ENV === 'production';

const BASE_OPTIONS = {
  httpOnly: true,
  secure: isSecure,
  sameSite: 'lax' as const,
  path: '/',
  domain: env.COOKIE_DOMAIN,
};

export const authCookie = (maxAge: number) => ({
  ...BASE_OPTIONS,
  maxAge,
});

export const deletedCookie = () => authCookie(0);
