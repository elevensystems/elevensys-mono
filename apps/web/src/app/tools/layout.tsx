import type React from 'react';

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { sidebarToolsFlag } from '@/flags';
import { getVisibleToolPaths } from '@/lib/flags-utils';

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visibleTools, headersList] = await Promise.all([
    sidebarToolsFlag(),
    headers(),
  ]);

  const allowedPaths = getVisibleToolPaths(visibleTools);

  // null means show all tools — skip the check.
  if (allowedPaths !== null) {
    const pathname = headersList.get('x-pathname') ?? '';
    if (!allowedPaths.includes(pathname)) {
      notFound();
    }
  }

  return <>{children}</>;
}
