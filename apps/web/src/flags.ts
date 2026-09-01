import { vercelAdapter } from '@flags-sdk/vercel';
import { flag } from 'flags/next';

/**
 * `vercelAdapter()` needs the Vercel Flags integration to be connected. Until
 * it is, fall back to the flag's default value instead of failing the build.
 */
const flagsProvisioned = Boolean(process.env.FLAGS);

export const sidebarToolsFlag = flag<string>({
  key: 'sidebar-tools',
  description:
    'Controls which tools are shown in the sidebar. JSON array of tool URL paths. Empty string means show all.',
  defaultValue: '',
  options: [
    { value: '', label: 'All tools' },
    { value: '[]', label: 'No tools' },
  ],
  ...(flagsProvisioned ? { adapter: vercelAdapter() } : { decide: () => '' }),
});
