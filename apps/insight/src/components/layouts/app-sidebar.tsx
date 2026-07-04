'use client';

import * as React from 'react';
import { Suspense } from 'react';

import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar';
import { ChartPie } from 'lucide-react';

import { NavMain } from '@/components/layouts/nav-main';
import { NavSecondary } from '@/components/layouts/nav-secondary';
import { NavUser } from '@/components/layouts/nav-user';
import { appSidebarData } from '@/lib/app-sidebar-config';
import type { AuthUser } from '@/types/auth';

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: AuthUser | null;
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-sm">
                  <ChartPie className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {appSidebarData.appName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Version 1.0.1b
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
      <SidebarFooter>
        <NavUser user={user ?? null} />
      </SidebarFooter>
    </Sidebar>
  );
}
