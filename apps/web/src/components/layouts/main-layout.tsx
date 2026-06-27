'use client';

import { ReactNode } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AppSidebar } from '@/components/layouts/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import { Separator } from '@workspace/ui/components/separator';
import { SidebarAutoCollapse } from '@workspace/ui/components/sidebar-auto-collapse';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@workspace/ui/components/sidebar';
import { useAuth } from '@/contexts/auth-context';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  /** Optional announcement banner rendered flush under the sticky header. */
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
  const pathname = usePathname();
  const { user } = useAuth();

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split('/').filter(Boolean);

  // Helper function to format segment text
  const formatSegment = (segment: string) => {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathSegments.length > 0 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
                {pathSegments.map((segment, index) => {
                  const isLast = index === pathSegments.length - 1;
                  const href = '/' + pathSegments.slice(0, index + 1).join('/');

                  return (
                    <div key={href} className="contents">
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>
                            {formatSegment(segment)}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild className="hidden md:block">
                            <Link href={href}>{formatSegment(segment)}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </div>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {banner}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <main className={className}>{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
