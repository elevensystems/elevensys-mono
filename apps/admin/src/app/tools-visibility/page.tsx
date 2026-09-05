import { redirect } from 'next/navigation';

import { Banner } from '@workspace/ui/components/banner';

import { ToolsVisibilityForm } from '@/app/tools-visibility/_components/tools-visibility-form';
import MainLayout from '@/components/layouts/main-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { PageShell } from '@/components/layouts/page-shell';
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

  // Save sits in the title row and needs the form's dirty state, so the editor
  // renders the header itself; the branches below have nothing to save.
  if (snapshot?.configured && !loadError) {
    return (
      <MainLayout>
        <PageShell>
          <ToolsVisibilityForm snapshot={snapshot} />
        </PageShell>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageShell>
        <PageHeader title="Tools Visibility" />

        {loadError ? (
          <Banner
            state="error"
            title="Could not load the tool list"
            message={loadError}
          />
        ) : (
          <Banner
            state="warning"
            title="Global Config storage is not configured"
            message="Connect a Global Config store to this project and set VERCEL_API_TOKEN (plus VERCEL_TEAM_ID on a team) so tool visibility can be saved."
          />
        )}
      </PageShell>
    </MainLayout>
  );
}
