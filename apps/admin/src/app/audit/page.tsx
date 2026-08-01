import { redirect } from 'next/navigation';

import { AuditTable } from '@/components/features/audit/audit-table';
import MainLayout from '@/components/layouts/main-layout';
import { getUserFromSession } from '@/lib/auth';

export default async function AuditPage() {
  const user = await getUserFromSession();
  if (!user) redirect('/login');

  return (
    <MainLayout>
      <section className="container mx-auto px-2 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        </div>
        <AuditTable />
      </section>
    </MainLayout>
  );
}
