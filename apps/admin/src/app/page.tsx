import Link from 'next/link';

import { Link as LinkIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';

import MainLayout from '@/components/layouts/main-layout';
import { getUserFromSession } from '@/lib/auth';

export default async function AdminDashboardPage() {
  const user = await getUserFromSession();

  return (
    <MainLayout>
      <section className="container mx-auto px-2 py-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome{user ? `, ${user.name}` : ''}
            </h1>
          </div>

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
        </div>
      </section>
    </MainLayout>
  );
}
