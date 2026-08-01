import {
  Braces,
  CaseSensitive,
  Home,
  Key,
  Languages,
  LifeBuoy,
  Link as LinkIcon,
  Music4,
  Package,
  ScanSearch,
  Send,
  Sparkles,
} from 'lucide-react';

import type { ToolConfig } from '@/lib/tools-config';
import type { AuthUser } from '@/types/auth';

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
      name: 'Beatly',
      url: '/tools/beatly',
      icon: Music4,
    },
  ] satisfies ToolConfig[],
};
