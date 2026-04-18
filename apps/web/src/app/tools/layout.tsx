import type React from 'react';

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { visibleToolsFlag } from '@/flags';
import type { TenantKey } from '@/lib/domain-config';
import { getVisibleToolPaths } from '@/lib/flags-utils';

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visibleTools, headersList] = await Promise.all([
    visibleToolsFlag(),
    headers(),
  ]);

  const tenant = (headersList.get('x-tenant') as TenantKey) ?? 'elevensys';
  const allowedPaths = getVisibleToolPaths(visibleTools, tenant);

  // null means show all tools for this tenant — skip the check.
  if (allowedPaths !== null) {
    const pathname = headersList.get('x-pathname') ?? '';
    if (!allowedPaths.includes(pathname)) {
      notFound();
    }
  }

  return <>{children}</>;
}
