'use client';

import { ReactNode, Suspense } from 'react';

import { usePathname } from 'next/navigation';

import { PathBreadcrumb } from '@workspace/ui/components/path-breadcrumb';
import { Separator } from '@workspace/ui/components/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@workspace/ui/components/sidebar';
import { SidebarAutoCollapse } from '@workspace/ui/components/sidebar-auto-collapse';
import { SiteBanner } from '@workspace/ui/components/site-banner';

import { AppSidebar } from '@/components/layouts/app-sidebar';
import {
  ProjectSwitcher,
  isProjectScopedRoute,
} from '@/components/layouts/project-switcher';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
  /**
   * Announcement banner rendered flush under the sticky header. Defaults to
   * the announcement from Global Config; pass `null` to suppress it.
   */
  banner?: ReactNode;
}

/** Path segments that group pages but have no page of their own. */
const GROUP_ONLY_SEGMENTS = new Set(['timesheet']);

export default function MainLayout({
  children,
  className = '',
  headerRight,
  banner,
}: MainLayoutProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarAutoCollapse />
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/50 backdrop-blur">
          <div className="flex flex-1 items-center gap-2 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <PathBreadcrumb groupOnlySegments={GROUP_ONLY_SEGMENTS} />
            </div>
            <div className="ml-auto flex items-center gap-3 pr-4">
              {isProjectScopedRoute(pathname) && (
                <Suspense fallback={null}>
                  <ProjectSwitcher />
                </Suspense>
              )}
              {headerRight}
            </div>
          </div>
        </header>
        {banner === undefined ? <SiteBanner /> : banner}
        <div className="flex flex-1 flex-col gap-4 p-6">
          <main className={className}>{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
