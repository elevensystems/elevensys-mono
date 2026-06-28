'use client';

import * as React from 'react';

import Link from 'next/link';

import { BarChart2 } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar';

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
                  <BarChart2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {appSidebarData.appName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Usage analytics
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={appSidebarData.navMain} />
      </SidebarContent>
      <NavSecondary className="relative before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-sidebar before:to-transparent" />
      <SidebarFooter>
        <NavUser user={user ?? null} />
      </SidebarFooter>
    </Sidebar>
  );
}
