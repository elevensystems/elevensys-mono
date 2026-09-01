import { redirect } from 'next/navigation';

import { Banner } from '@workspace/ui/components/banner';

import { SiteBannerForm } from '@/app/flags/site-banner/_components/site-banner-form';
import MainLayout from '@/components/layouts/main-layout';
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

  return (
    <MainLayout>
      <section className="container mx-auto px-2 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Site Banner</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Post an announcement across the platform. Changes go live without a
            deploy.
          </p>
        </div>

        {loadError ? (
          <Banner
            state="error"
            title="Could not load the banner"
            message={loadError}
          />
        ) : snapshot?.configured ? (
          <SiteBannerForm snapshot={snapshot} />
        ) : (
          <Banner
            state="warning"
            title="Banner storage is not configured"
            message="Connect a Global Config store to this project and set VERCEL_API_TOKEN (plus VERCEL_TEAM_ID on a team) so announcements can be saved."
          />
        )}
      </section>
    </MainLayout>
  );
}
