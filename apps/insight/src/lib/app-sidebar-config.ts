import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard } from 'lucide-react';

export interface NavSubItem {
  title: string;
  url: string;
  icon: LucideIcon;
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
  appName: 'Insight',
  navMain: [{ title: 'Home', url: '/', icon: LayoutDashboard }],
};
