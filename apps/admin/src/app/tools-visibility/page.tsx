import { redirect } from 'next/navigation';

import { Banner } from '@workspace/ui/components/banner';

import { ToolsVisibilityForm } from '@/app/tools-visibility/_components/tools-visibility-form';
import MainLayout from '@/components/layouts/main-layout';
import { getUserFromSession } from '@/lib/auth';
import { readToolsVisibilitySnapshot } from '@/lib/tools-visibility-admin';
import type { ToolsVisibilitySnapshot } from '@/types/tools-visibility';

export const metadata = {
  title: 'Tools Visibility',
};

export default async function ToolsVisibilityPage() {
  const user = await getUserFromSession();
  if (!user) redirect('/login');

  let snapshot: ToolsVisibilitySnapshot | null = null;
  let loadError: string | null = null;

  try {
    snapshot = await readToolsVisibilitySnapshot();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : 'Could not read the tool list.';
  }

  return (
    <MainLayout>
      <section className="container mx-auto px-2 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Tools Visibility
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose which tools appear in the web app. Changes go live without a
            deploy.
          </p>
        </div>

        {loadError ? (
          <Banner
            state="error"
            title="Could not load the tool list"
            message={loadError}
          />
        ) : snapshot?.configured ? (
          <ToolsVisibilityForm snapshot={snapshot} />
        ) : (
          <Banner
            state="warning"
            title="Global Config storage is not configured"
            message="Connect a Global Config store to this project and set VERCEL_API_TOKEN (plus VERCEL_TEAM_ID on a team) so tool visibility can be saved."
          />
        )}
      </section>
    </MainLayout>
  );
}
