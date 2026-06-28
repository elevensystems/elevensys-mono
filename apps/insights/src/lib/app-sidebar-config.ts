import type { LucideIcon } from 'lucide-react';
import { BarChart2, LayoutDashboard } from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const appSidebarData: {
  appName: string;
  navMain: NavItem[];
} = {
  appName: 'Insights',
  navMain: [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Claude Usage', url: '/claude-usage', icon: BarChart2 },
  ],
};
