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

export type { AuthUser, UserRole } from '@workspace/ui/lib/utils';
