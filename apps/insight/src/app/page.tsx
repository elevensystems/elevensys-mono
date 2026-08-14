import { redirect } from 'next/navigation';

import MainLayout from '@/components/layouts/main-layout';
import { getUserFromSession } from '@/lib/auth';

export default async function InsightDashboardPage() {
  const user = await getUserFromSession();

  if (!user) redirect('/login');

  return (
    <MainLayout>
      <section className="container mx-auto px-2 py-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
