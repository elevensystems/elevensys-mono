import { ReactNode, Suspense } from 'react';

import { DateRangeControl } from '@/components/features/claude-watch/date-range-control';
import MainLayout from '@/components/layouts/main-layout';

export default function ClauseUsageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MainLayout
      headerRight={
        <Suspense fallback={null}>
          <DateRangeControl />
        </Suspense>
      }
    >
      <Suspense fallback={null}>{children}</Suspense>
    </MainLayout>
  );
}
