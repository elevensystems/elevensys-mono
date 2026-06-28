'use client';

import * as React from 'react';

import Link from 'next/link';

import { Check, ChevronsUpDown } from 'lucide-react';

import { FeedbackModal } from '@/components/layouts/feedback-modal';
import { NavMain } from '@/components/layouts/nav-main';
import { NavSecondary } from '@/components/layouts/nav-secondary';
import { NavTools } from '@/components/layouts/nav-tools';
import { NavUser } from '@/components/layouts/nav-user';
import { SupportModal } from '@/components/layouts/support-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
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
import { useDomain } from '@/contexts/domain-context';
import {
  getVisibleToolPaths,
  isFlagEnabled,
  useFlags,
} from '@/contexts/flags-context';
import { appSidebarData } from '@/lib/app-sidebar-config';
import type { AuthUser } from '@/types/auth';

import DiasporaIcon from '@workspace/ui/components/diaspora-icon';
import SolidDinosaurIcon from '@workspace/ui/components/solid-dinosaur-icon';

const hasData = <T,>(data: T[] | undefined | null): boolean => {
  return Boolean(data && data.length > 0);
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: AuthUser | null;
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);
  const domainConfig = useDomain();
  const tenant = domainConfig.tenant;
  const flags = useFlags();
  const navMain = React.useMemo(
    () =>
      appSidebarData.navMain.filter(item => isFlagEnabled(flags, item.flagKey)),
    [flags]
  );
  const tools = React.useMemo(() => {
    const visiblePaths = getVisibleToolPaths(flags, tenant);
    if (visiblePaths === null) return appSidebarData.tools;
    return appSidebarData.tools.filter(tool => visiblePaths.includes(tool.url));
  }, [flags, tenant]);

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-sm">
                      {tenant === 'fhmhub' ? (
                        <SolidDinosaurIcon className="size-4 fill-current" />
                      ) : (
                        <DiasporaIcon className="size-4 fill-current" />
                      )}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {domainConfig.appName}
                      </span>
                      <span className="truncate text-xs">Version 7.1.6</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild>
                    <a
                      href="https://logwork.fhmhub.com"
                      className="cursor-pointer"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <SolidDinosaurIcon className="size-3.5 fill-current shrink-0" />
                      </div>
                      Jirassic World
                      {tenant === 'fhmhub' && <Check className="ml-auto" />}
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="https://www.elevensystems.dev/"
                      className="cursor-pointer"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <DiasporaIcon className="size-3.5 fill-current shrink-0" />
                      </div>
                      Eleven Systems
                      {tenant === 'elevensys' && <Check className="ml-auto" />}
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          {hasData(navMain) && <NavMain items={navMain} />}
          {domainConfig.showTools && hasData(tools) && (
            <NavTools tools={tools} />
          )}
        </SidebarContent>
        {hasData(appSidebarData.navSecondary) && (
          <NavSecondary
            className="relative before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-sidebar before:to-transparent"
            items={appSidebarData.navSecondary}
            onItemClick={handleNavAction}
          />
        )}
        <SidebarFooter>
          {(user || tenant !== 'fhmhub') && <NavUser user={user} />}
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
