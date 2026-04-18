import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type UserRole = 'free' | 'pro';

export type AuthUser = {
  sub: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  groups: string[];
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hasRole = (
  user: AuthUser | null | undefined,
  roles: UserRole[]
): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};
