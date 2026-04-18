import type React from 'react';

import {
  Braces,
  CaseSensitive,
  Clock,
  Home,
  Key,
  Languages,
  LifeBuoy,
  Link2,
  Link as LinkIcon,
  Music4,
  Package,
  RefreshCw,
  ScanSearch,
  ScrollText,
  Send,
  Settings,
  Sparkles,
} from 'lucide-react';

import type { ToolConfig } from '@/lib/tools-config';
import type { AuthUser } from '@/types/auth';

export interface NavMainItem {
  title: string;
  url: string;
  icon: React.ComponentType;
  isActive: boolean;
  flagKey?: string;
  items?: { title: string; url: string }[];
}

/**
 * Sidebar navigation and tools configuration
 */
export const appSidebarData = {
  user: null as AuthUser | null,
  navHome: {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  navMain: [
    // Items with a `flagKey` are hidden when that flag is disabled.
    {
      title: 'Timesheet',
      url: '/timesheet',
      icon: Clock,
      isActive: true,
      items: [
        {
          title: 'Log Work',
          url: '/timesheet/logwork',
        },
        {
          title: 'My Worklogs',
          url: '/timesheet/my-worklogs',
        },
        {
          title: 'Project Worklogs',
          url: '/timesheet/project-worklogs',
        },
        // {
        //   title: 'Worklog Management',
        //   url: '/timesheet/worklog-management',
        // },
      ],
    },
    {
      title: 'Autolog',
      url: '/timesheet/autolog',
      icon: RefreshCw,
      isActive: false,
      flagKey: 'enable-autolog',
    },
    {
      title: 'Configs',
      url: '/timesheet/config',
      icon: Settings,
      isActive: false,
    },
  ] satisfies NavMainItem[],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
      onClick: 'support',
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
      onClick: 'feedback',
    },
  ],
  tools: [
    {
      name: 'JSON Diffinity',
      url: '/tools/json-diffinity',
      icon: Braces,
    },
    {
      name: 'JSON Objectify',
      url: '/tools/json-objectify',
      icon: Sparkles,
    },
    {
      name: 'JSON Lens',
      url: '/tools/json-lens',
      icon: ScanSearch,
    },
    {
      name: 'Caseify',
      url: '/tools/caseify',
      icon: CaseSensitive,
    },
    {
      name: 'Urlify',
      url: '/tools/urlify',
      icon: LinkIcon,
    },
    {
      name: 'Translately',
      url: '/tools/translately',
      icon: Languages,
      isPro: true,
    },
    {
      name: 'NPM Converter',
      url: '/tools/npm-converter',
      icon: Package,
    },
    {
      name: 'Passly',
      url: '/tools/passly',
      icon: Key,
    },
    {
      name: 'PR Link Shrinker',
      url: '/tools/pr-link-shrinker',
      icon: Link2,
    },
    {
      name: 'Prompt Templates',
      url: '/tools/prompt-templates',
      icon: ScrollText,
      isPro: true,
    },
    {
      name: 'Beatly',
      url: '/tools/beatly',
      icon: Music4,
    },
  ] satisfies ToolConfig[],
};
