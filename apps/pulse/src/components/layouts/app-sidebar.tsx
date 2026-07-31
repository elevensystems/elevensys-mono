'use client';

import * as React from 'react';
import { Suspense } from 'react';

import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar';
import { Clock } from 'lucide-react';

import { NavMain } from '@/components/layouts/nav-main';
import { NavSecondary } from '@/components/layouts/nav-secondary';
import { appSidebarData } from '@/lib/app-sidebar-config';

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-sm">
                  <Clock className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {appSidebarData.appName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Timesheet
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={null}>
          <NavMain items={appSidebarData.navMain} />
        </Suspense>
      </SidebarContent>
      <NavSecondary className="relative before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-sidebar before:to-transparent" />
    </Sidebar>
  );
}
