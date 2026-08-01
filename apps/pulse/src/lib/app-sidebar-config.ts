import type { LucideIcon } from 'lucide-react';
import { Clock, Home, RefreshCw, Settings } from 'lucide-react';

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  /** Omitted for items that only group sub-items and have no page of their own. */
  url?: string;
  icon: LucideIcon;
  items?: NavSubItem[];
}

export interface NavGroup {
  /** Rendered as the group heading; omitted for ungrouped items. */
  label?: string;
  items: NavItem[];
}

export const appSidebarData: {
  appName: string;
  navGroups: NavGroup[];
} = {
  appName: 'Jirassic World',
  navGroups: [
    {
      items: [{ title: 'Home', url: '/', icon: Home }],
    },
    {
      label: 'Jira',
      items: [
        {
          title: 'Timesheet',
          icon: Clock,
          items: [
            { title: 'Log Work', url: '/logwork' },
            { title: 'My Worklogs', url: '/my-worklogs' },
            { title: 'Project Worklogs', url: '/project-worklogs' },
          ],
        },
        { title: 'Autolog', url: '/autolog', icon: RefreshCw },
      ],
    },
    {
      items: [{ title: 'Configs', url: '/config', icon: Settings }],
    },
  ],
};
