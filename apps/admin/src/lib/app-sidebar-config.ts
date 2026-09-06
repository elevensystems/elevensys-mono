import type { LucideIcon } from 'lucide-react';
import {
  CalendarClock,
  LayoutDashboard,
  Link as LinkIcon,
  Megaphone,
  ScrollText,
  Wrench,
} from 'lucide-react';

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: NavSubItem[];
}

export const appSidebarData: {
  appName: string;
  navMain: NavItem[];
} = {
  appName: 'Admin',
  navMain: [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Urlify', url: '/urlify', icon: LinkIcon },
    { title: 'Autolog', url: '/autolog', icon: CalendarClock },
    { title: 'Site Banner', url: '/site-banner', icon: Megaphone },
    { title: 'Tools Visibility', url: '/tools-visibility', icon: Wrench },
    {
      title: 'Audit',
      url: '/audit',
      icon: ScrollText,
      items: [
        { title: 'Logs', url: '/audit' },
        { title: 'Stats', url: '/audit/stats' },
      ],
    },
  ],
};
