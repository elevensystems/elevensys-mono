'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar';

import type { NavItem } from '@/lib/app-sidebar-config';

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const matches = (url: string) => {
    if (url === '/') return pathname === '/';
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const activeUrl = items
    .filter(item => matches(item.url))
    .reduce<string | null>(
      (longest, item) =>
        longest === null || item.url.length > longest.length ? item.url : longest,
      null,
    );

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map(item => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={item.url === activeUrl}
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
