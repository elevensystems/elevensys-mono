import { redirect } from 'next/navigation';

import MainLayout from '@/components/layouts/main-layout';
import { PageShell } from '@/components/layouts/page-shell';
import { apiFetch } from '@/lib/api-fetch';
import { getAccessToken } from '@/lib/auth';
import type { AutologConfig } from '@/types/autolog';

import { AutologTable } from './_components/autolog-table';

/**
 * `GET /autolog` answers `{ configs: [...] }`. The bare-array form is
 * accepted too, so a future unwrapping of the envelope cannot blank the page.
 */
type AllConfigsResponse = AutologConfig[] | { configs?: AutologConfig[] };

const toConfigs = (result: AllConfigsResponse | null): AutologConfig[] => {
  if (Array.isArray(result)) return result;
  return result?.configs ?? [];
};

export default async function AutologPage() {
  const accessToken = await getAccessToken();
  if (!accessToken) redirect('/login');

  let configs: AutologConfig[] = [];
  let loadError: string | null = null;

  try {
    // `/autolog`, not `/jira/autolog`: the backend gates this on the Cognito
    // `admin` group and returns every user's configs, where `/jira/*` expects
    // the caller's own Jira token and answers only for them.
    const result = await apiFetch<AllConfigsResponse>('/autolog', {
      accessToken,
      method: 'GET',
    });
    configs = toConfigs(result);
  } catch (err) {
    console.error('Failed to load autolog configs:', err);
    loadError =
      err instanceof Error ? err.message : 'Failed to load autolog configs';
  }

  return (
    <MainLayout>
      <PageShell>
        <AutologTable configs={configs} loadError={loadError} />
      </PageShell>
    </MainLayout>
  );
}
