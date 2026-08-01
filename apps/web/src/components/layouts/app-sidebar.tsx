'use client';

import * as React from 'react';

import Link from 'next/link';

import DiasporaIcon from '@workspace/ui/components/diaspora-icon';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar';

import { FeedbackModal } from '@/components/layouts/feedback-modal';
import { NavSecondary } from '@/components/layouts/nav-secondary';
import { NavTools } from '@/components/layouts/nav-tools';
import { NavUser } from '@/components/layouts/nav-user';
import { SupportModal } from '@/components/layouts/support-modal';
import { getVisibleToolPaths, useFlags } from '@/contexts/flags-context';
import { appSidebarData } from '@/lib/app-sidebar-config';
import { APP_NAME } from '@/lib/constants';
import type { AuthUser } from '@/types/auth';

const hasData = <T,>(data: T[] | undefined | null): boolean => {
  return Boolean(data && data.length > 0);
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: AuthUser | null;
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);
  const flags = useFlags();
  const tools = React.useMemo(() => {
    const visiblePaths = getVisibleToolPaths(flags);
    if (visiblePaths === null) return appSidebarData.tools;
    return appSidebarData.tools.filter(tool => visiblePaths.includes(tool.url));
  }, [flags]);

  const handleNavAction = (action?: string) => {
    if (action === 'support') {
      setIsSupportModalOpen(true);
    } else if (action === 'feedback') {
      setIsFeedbackModalOpen(true);
    }
  };

  return (
    <>
      <Sidebar variant="sidebar" collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-sm">
                    <DiasporaIcon className="size-4 fill-current" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{APP_NAME}</span>
                    <span className="truncate text-xs">Version 7.1.6</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={appSidebarData.navHome.title}
                >
                  <Link href={appSidebarData.navHome.url}>
                    <appSidebarData.navHome.icon />
                    <span>{appSidebarData.navHome.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          {hasData(tools) && <NavTools tools={tools} />}
        </SidebarContent>
        {hasData(appSidebarData.navSecondary) && (
          <NavSecondary
            className="relative before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-sidebar before:to-transparent"
            items={appSidebarData.navSecondary}
            onItemClick={handleNavAction}
          />
        )}
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>
      <SupportModal
        open={isSupportModalOpen}
        onOpenChange={setIsSupportModalOpen}
      />
      <FeedbackModal
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
      />
    </>
  );
}
