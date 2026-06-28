import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  FolderGit2,
  History,
  LayoutDashboard,
  Tags,
  Users,
  Wrench,
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

const CLAUDE_WATCH = '/claude-watch';

export const appSidebarData: {
  appName: string;
  navMain: NavItem[];
} = {
  appName: 'Insights',
  navMain: [
    { title: 'Overview', url: CLAUDE_WATCH, icon: LayoutDashboard },
    { title: 'Developers', url: `${CLAUDE_WATCH}/developers`, icon: Users },
    { title: 'Projects', url: `${CLAUDE_WATCH}/projects`, icon: FolderGit2 },
    { title: 'Sessions', url: `${CLAUDE_WATCH}/sessions`, icon: History },
    { title: 'Models', url: `${CLAUDE_WATCH}/models`, icon: Boxes },
    { title: 'Tools', url: `${CLAUDE_WATCH}/tools`, icon: Wrench },
    {
      title: 'Prompt Categories',
      url: `${CLAUDE_WATCH}/prompt-categories`,
      icon: Tags,
    },
  ],
};
