import { TOOLS, type ToolPath } from '@workspace/ui/lib/tools';
import {
  Braces,
  CaseSensitive,
  Home,
  Key,
  Languages,
  LifeBuoy,
  Link as LinkIcon,
  type LucideIcon,
  Music4,
  Package,
  ScanSearch,
  Send,
  Sparkles,
} from 'lucide-react';

import type { ToolConfig } from '@/lib/tools-config';
import type { AuthUser } from '@/types/auth';

/**
 * Presentation for each tool. Names and URLs come from the shared `TOOLS`
 * catalogue so `apps/admin` renders the same list; only the parts the sidebar
 * needs live here.
 */
const TOOL_ICONS: Record<ToolPath, LucideIcon> = {
  '/tools/json-diffinity': Braces,
  '/tools/json-objectify': Sparkles,
  '/tools/json-lens': ScanSearch,
  '/tools/caseify': CaseSensitive,
  '/tools/urlify': LinkIcon,
  '/tools/translately': Languages,
  '/tools/npm-converter': Package,
  '/tools/passly': Key,
  '/tools/beatly': Music4,
};

const PRO_TOOLS = new Set<ToolPath>(['/tools/translately']);

const tools: ToolConfig[] = TOOLS.map(tool => ({
  name: tool.name,
  url: tool.url,
  icon: TOOL_ICONS[tool.url],
  ...(PRO_TOOLS.has(tool.url) ? { isPro: true } : {}),
}));

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
  tools,
};
