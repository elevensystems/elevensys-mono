import { notFound } from 'next/navigation';

import { enableAutologFlag } from '@/flags';

export default async function AutologLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const enabled = await enableAutologFlag();

  if (!enabled) {
    notFound();
  }

  return <>{children}</>;
}
