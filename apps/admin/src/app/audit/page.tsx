import { redirect } from 'next/navigation';

import MainLayout from '@/components/layouts/main-layout';
import { AuditTable } from '@/components/features/audit/audit-table';
import { getUserFromSession } from '@/lib/auth';

export default async function AuditPage() {
  const user = await getUserFromSession();
  if (!user) redirect('/login');

  return (
    <MainLayout>
      <section className="container mx-auto px-2 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        </div>
        <AuditTable />
      </section>
    </MainLayout>
  );
}
