import type React from 'react';

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getVisibleToolPaths } from '@/lib/sidebar-tools-server';

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allowedPaths, headersList] = await Promise.all([
    getVisibleToolPaths(),
    headers(),
  ]);

  // null means show all tools — skip the check.
  if (allowedPaths !== null) {
    const pathname = headersList.get('x-pathname') ?? '';
    if (!allowedPaths.includes(pathname)) {
      notFound();
    }
  }

  return <>{children}</>;
}
