import { redirect } from 'next/navigation';

import { Banner } from '@workspace/ui/components/banner';

import { SiteBannerForm } from '@/app/site-banner/_components/site-banner-form';
import MainLayout from '@/components/layouts/main-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { PageShell } from '@/components/layouts/page-shell';
import { getUserFromSession } from '@/lib/auth';
import { readSiteBannerSnapshot } from '@/lib/global-config-admin';
import type { SiteBannerSnapshot } from '@/types/site-banner';

export const metadata = {
  title: 'Site Banner',
};

export default async function SiteBannerPage() {
  const user = await getUserFromSession();
  if (!user) redirect('/login');

  let snapshot: SiteBannerSnapshot | null = null;
  let loadError: string | null = null;

  try {
    snapshot = await readSiteBannerSnapshot();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : 'Could not read the banner.';
  }

  // The editor owns the title row, because Publish sits in it and needs the
  // composer's state. The branches below have nothing to publish, so they
  // render the same header without an action.
  if (snapshot?.configured && !loadError) {
    return (
      <MainLayout>
        <PageShell>
          <SiteBannerForm snapshot={snapshot} />
        </PageShell>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageShell>
        <PageHeader title="Site Banner" />

        {loadError ? (
          <Banner
            state="error"
            title="Could not load the banner"
            message={loadError}
          />
        ) : (
          <Banner
            state="warning"
            title="Banner storage is not configured"
            message="Connect a Global Config store to this project and set VERCEL_API_TOKEN (plus VERCEL_TEAM_ID on a team) so announcements can be saved."
          />
        )}
      </PageShell>
    </MainLayout>
  );
}
