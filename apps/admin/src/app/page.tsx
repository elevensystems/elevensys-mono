import Link from 'next/link';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  SIDEBAR_TOOLS_ITEM_KEY,
  TOOLS,
  parseVisibleToolPaths,
} from '@workspace/ui/lib/tools';
import { ArrowRight } from 'lucide-react';

import { ChangeLog } from '@/components/features/change-log';
import MainLayout from '@/components/layouts/main-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { PageShell } from '@/components/layouts/page-shell';
import { appSidebarData } from '@/lib/app-sidebar-config';
import { getUserFromSession } from '@/lib/auth';
import { readBannerConfig } from '@/lib/global-config-admin';
import {
  isGlobalConfigConfigured,
  readAudit,
  readItems,
} from '@/lib/global-config-client';
import type { ConfigAuditEntry } from '@/types/config-audit';

const DESCRIPTIONS: Record<string, string> = {
  '/urlify': 'Manage shortened URLs — view, paginate, and delete.',
  '/site-banner': 'Publish announcement and maintenance banners to every app.',
  '/tools-visibility': 'Choose which tools appear in the web app sidebar.',
  '/audit': 'Browse audit logs and usage stats.',
};

const SECTIONS = appSidebarData.navMain.filter(item => item.url !== '/');

interface DashboardData {
  status: Record<string, string>;
  history: ConfigAuditEntry[];
}

/**
 * One Global Config read for every live status on the page. A missing or
 * unreachable store just leaves the tiles without a status line.
 */
async function readDashboardData(): Promise<DashboardData | null> {
  if (!isGlobalConfigConfigured()) return null;

  try {
    const items = await readItems();
    const banners = Object.values(readBannerConfig(items)).flat().length;
    const visible = parseVisibleToolPaths(items[SIDEBAR_TOOLS_ITEM_KEY]);

    return {
      status: {
        '/site-banner':
          banners === 0
            ? 'No banners'
            : `${banners} banner${banners === 1 ? '' : 's'} live or scheduled`,
        '/tools-visibility':
          visible === null
            ? `All ${TOOLS.length} tools visible`
            : `${visible.length} of ${TOOLS.length} tools visible`,
      },
      history: readAudit(items),
    };
  } catch (error) {
    console.error('[dashboard] Global Config read failed', error);
    return null;
  }
}

export default async function AdminDashboardPage() {
  const [user, data] = await Promise.all([
    getUserFromSession(),
    readDashboardData(),
  ]);

  return (
    <MainLayout>
      <PageShell>
        <PageHeader title={`Welcome${user ? `, ${user.name}` : ''}`} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SECTIONS.map(({ title, url, icon: Icon }) => (
            <Link
              key={url}
              href={url}
              className="group focus-visible:ring-ring rounded-xl outline-none focus-visible:ring-2"
            >
              <Card className="group-hover:border-foreground/20 h-full transition-colors">
                <CardHeader>
                  <div className="bg-surface text-foreground mb-2 flex size-9 items-center justify-center rounded-lg border">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{DESCRIPTIONS[url]}</CardDescription>
                </CardHeader>
                <CardFooter className="text-muted-foreground mt-auto justify-between text-[13px]">
                  <span className="min-h-5">{data?.status[url]}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>

        {data && (
          <div className="mt-6">
            <ChangeLog entries={data.history} />
          </div>
        )}
      </PageShell>
    </MainLayout>
  );
}
