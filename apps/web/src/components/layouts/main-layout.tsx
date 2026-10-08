'use client';

import { ReactNode } from 'react';

import { useAuth } from '@workspace/ui/components/auth-provider';
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

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  /**
   * Announcement banner rendered flush under the sticky header. Defaults to
   * the announcement from Global Config; pass `null` to suppress it.
   */
  banner?: ReactNode;
}

/**
 * Main layout with floating sidebar
 * Includes collapsible sidebar with navigation, projects, and user menu
 * Sidebar state is persisted globally using localStorage
 */
export default function MainLayout({
  children,
  className = '',
  banner,
}: MainLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarAutoCollapse />
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/50 backdrop-blur">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <PathBreadcrumb />
          </div>
        </header>
        {banner === undefined ? <SiteBanner /> : banner}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <main className={className}>{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
