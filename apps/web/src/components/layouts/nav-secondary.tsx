import * as React from 'react';

import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

const THEMES = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'System', value: 'system', icon: Monitor },
] as const;

export function NavSecondary({
  items,
  onItemClick,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    onClick?: string;
  }[];
  onItemClick?: (action?: string) => void;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { setTheme, theme } = useTheme();
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              {item.onClick ? (
                <SidebarMenuButton
                  size="sm"
                  onClick={e => {
                    e.preventDefault();
                    onItemClick?.(item.onClick);
                  }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild size="sm">
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="sm">
                  <Palette />
                  <span>Theme</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                {THEMES.map(({ label, value, icon: Icon }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setTheme(value)}
                    className={theme === value ? 'bg-accent' : ''}
                  >
                    <Icon />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
