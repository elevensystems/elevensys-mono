import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  FolderSearch,
  Home,
  PenLine,
  RefreshCw,
  Settings,
} from 'lucide-react';

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
  appName: 'Jirassic World',
  navMain: [
    { title: 'Home', url: '/', icon: Home },
    { title: 'Log Work', url: '/logwork', icon: PenLine },
    { title: 'My Worklogs', url: '/my-worklogs', icon: ClipboardList },
    { title: 'Project Worklogs', url: '/project-worklogs', icon: FolderSearch },
    { title: 'Autolog', url: '/autolog', icon: RefreshCw },
    { title: 'Configs', url: '/config', icon: Settings },
  ],
};
