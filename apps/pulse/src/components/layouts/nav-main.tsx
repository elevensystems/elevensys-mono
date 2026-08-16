'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@workspace/ui/components/sidebar';
import type { TokenProps } from '@workspace/ui/components/token';
import { Token } from '@workspace/ui/components/token';
import { ChevronRight } from 'lucide-react';

import type { NavGroup } from '@/lib/app-sidebar-config';

function NavBadge({
  label,
  color = 'blue',
}: {
  label: string;
  color?: TokenProps['color'];
}) {
  return (
    <Token
      color={color}
      shape="pill"
      density="compact"
      className="ml-auto group-data-[collapsible=icon]:hidden"
    >
      {label}
    </Token>
  );
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : '';

  const isActive = (url: string) => {
    if (url === '/') return pathname === '/';
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <>
      {groups.map((group, groupIndex) => (
        <SidebarGroup key={group.label ?? `group-${groupIndex}`}>
          {group.label ? (
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          ) : null}
          <SidebarMenu>
            {group.items.map(item =>
              item.items?.length ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={item.items.some(sub => isActive(sub.url))}
                      >
                        <item.icon />
                        <span className="truncate">{item.title}</span>
                        {item.badge ? (
                          <NavBadge
                            label={item.badge}
                            color={item.badgeColor}
                          />
                        ) : null}
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map(sub => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(sub.url)}
                            >
                              <Link href={`${sub.url}${suffix}`}>
                                <span>{sub.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={item.url ? isActive(item.url) : false}
                  >
                    <Link href={item.url ? `${item.url}${suffix}` : '#'}>
                      <item.icon />
                      <span className="truncate">{item.title}</span>
                      {item.badge ? (
                        <NavBadge label={item.badge} color={item.badgeColor} />
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
