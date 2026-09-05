import { redirect } from 'next/navigation';

import MainLayout from '@/components/layouts/main-layout';
import { PageShell } from '@/components/layouts/page-shell';
import { apiFetch } from '@/lib/api-fetch';
import { getAccessToken } from '@/lib/auth';
import type { ShortenedUrl } from '@/types/urlify';

import { UrlifyTable } from './urlify-table';

type UrlsResponse = {
  urls?: ShortenedUrl[];
  lastEvaluatedKey?: unknown;
};

type PageProps = {
  searchParams: Promise<{ limit?: string; lastKey?: string }>;
};

export default async function UrlifyPage({ searchParams }: PageProps) {
  const accessToken = await getAccessToken();
  if (!accessToken) redirect('/login');

  const { limit: limitParam, lastKey } = await searchParams;
  const limit = Number(limitParam ?? '20') || 20;

  const params = new URLSearchParams({ limit: String(limit) });
  if (lastKey) params.set('lastKey', lastKey);

  let urls: ShortenedUrl[] = [];
  let nextCursor: string | null = null;

  try {
    const result = await apiFetch<UrlsResponse>(
      `/urlify/urls?${params.toString()}`,
      { accessToken, method: 'GET' }
    );
    urls = result?.urls ?? [];
    nextCursor = result?.lastEvaluatedKey
      ? JSON.stringify(result.lastEvaluatedKey)
      : null;
  } catch (err) {
    console.error('Failed to load urlify urls:', err);
  }

  return (
    <MainLayout>
      <PageShell>
        <UrlifyTable
          initialUrls={urls}
          initialLimit={limit}
          nextCursor={nextCursor}
        />
      </PageShell>
    </MainLayout>
  );
}
