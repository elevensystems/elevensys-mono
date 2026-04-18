import { notFound } from 'next/navigation';

import { autologFlag } from '@/flags';

export default async function AutologLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const enabled = await autologFlag();

  if (!enabled) {
    notFound();
  }

  return <>{children}</>;
}
