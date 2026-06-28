import { BarChart2 } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';

import MainLayout from '@/components/layouts/main-layout';
import { getUserFromSession } from '@/lib/auth';

export default async function InsightsDashboardPage() {
  const user = await getUserFromSession();

  return (
    <MainLayout>
      <section className="container mx-auto px-2 py-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome{user ? `, ${user.name}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.email ?? 'Usage analytics dashboard'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart2 className="size-4" />
                  Claude Usage
                </CardTitle>
                <CardDescription>
                  Track API usage, token consumption, and costs over time.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
