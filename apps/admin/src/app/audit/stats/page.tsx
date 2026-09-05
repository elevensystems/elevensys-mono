import { redirect } from 'next/navigation';

import { AuditChart } from '@/components/features/audit/audit-chart';
import MainLayout from '@/components/layouts/main-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { PageShell } from '@/components/layouts/page-shell';
import { getUserFromSession } from '@/lib/auth';

export default async function AuditStatsPage() {
  const user = await getUserFromSession();
  if (!user) redirect('/login');

  return (
    <MainLayout>
      <PageShell>
        <PageHeader title="Audit Stats" />
        <AuditChart />
      </PageShell>
    </MainLayout>
  );
}
