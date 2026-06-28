'use client';

import { useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) return;
    window.location.replace('/api/auth/login');
  }, [error]);

  if (error === 'forbidden') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Your account isn&apos;t authorized to view this dashboard. Contact an
          administrator if you believe this is a mistake.
        </p>
        <a
          href="/api/auth/login"
          className="text-sm underline underline-offset-4"
        >
          Sign in with a different account
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
    </div>
  );
}
