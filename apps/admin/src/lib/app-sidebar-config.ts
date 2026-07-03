import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Link as LinkIcon, ScrollText, SquareKanban } from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const appSidebarData: {
  appName: string;
  navMain: NavItem[];
} = {
  appName: 'Admin',
  navMain: [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Urlify', url: '/urlify', icon: LinkIcon },
    { title: 'Audit', url: '/audit', icon: ScrollText },
    { title: 'Jira Logs', url: '/audit/jira', icon: SquareKanban },
  ],
};
