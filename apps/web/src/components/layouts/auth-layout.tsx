'use client';

import { ReactNode } from 'react';

import Link from 'next/link';

import { useDomain } from '@/contexts/domain-context';

import DiasporaIcon from '@workspace/ui/components/diaspora-icon';

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Auth layout for login/signup pages
 * Simple centered layout without navigation
 */
export default function AuthLayout({
  children,
  className = '',
}: AuthLayoutProps) {
  const { appName } = useDomain();

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-lg">
            <DiasporaIcon className="size-4 fill-current" />
          </div>
          {appName}
        </Link>
        <div className={className}>{children}</div>
      </div>
    </div>
  );
}
