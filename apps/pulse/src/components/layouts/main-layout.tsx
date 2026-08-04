'use client';

import { ReactNode } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import { Separator } from '@workspace/ui/components/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@workspace/ui/components/sidebar';
import { SidebarAutoCollapse } from '@workspace/ui/components/sidebar-auto-collapse';

import { AppSidebar } from '@/components/layouts/app-sidebar';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

/** Path segments that group pages but have no page of their own. */
const GROUP_ONLY_SEGMENTS = new Set(['timesheet']);

const formatSegment = (segment: string) =>
  segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function MainLayout({
  children,
  className = '',
  headerRight,
}: MainLayoutProps) {
  const pathname = usePathname();

  const pathSegments = pathname.split('/').filter(Boolean);

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
                    const href =
                      '/' + pathSegments.slice(0, index + 1).join('/');

                    return (
                      <div key={href} className="contents">
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>
                              {formatSegment(segment)}
                            </BreadcrumbPage>
                          ) : GROUP_ONLY_SEGMENTS.has(segment) ? (
                            <span className="hidden md:block">
                              {formatSegment(segment)}
                            </span>
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
            {headerRight && <div className="ml-auto pr-4">{headerRight}</div>}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <main className={className}>{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
