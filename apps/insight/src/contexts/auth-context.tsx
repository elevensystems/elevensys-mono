'use client';

import { ReactNode, createContext, useContext } from 'react';

import type { AuthUser } from '@/types/auth';

type AuthContextType = {
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: AuthUser | null;
}) {
  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
