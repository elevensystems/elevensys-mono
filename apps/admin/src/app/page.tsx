import Link from 'next/link';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Link as LinkIcon } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { PageShell } from '@/components/layouts/page-shell';
import { getUserFromSession } from '@/lib/auth';

export default async function AdminDashboardPage() {
  const user = await getUserFromSession();

  return (
    <MainLayout>
      <PageShell>
        <PageHeader title={`Welcome${user ? `, ${user.name}` : ''}`} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="size-4" />
                Urlify
              </CardTitle>
              <CardDescription>
                Manage shortened URLs — view, paginate, and delete.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/urlify">Open Urlify</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </MainLayout>
  );
}
