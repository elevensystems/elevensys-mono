import { vercelAdapter } from '@flags-sdk/vercel';
import { flag } from 'flags/next';

export const autologFlag = flag({
  key: 'autolog',
  description: 'Enable the Autolog feature',
  defaultValue: false,
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' },
  ],
  adapter: vercelAdapter(),
});

export const sidebarToolsFlag = flag<string>({
  key: 'sidebar-tools',
  description:
    'Controls which tools are shown in the sidebar. JSON array of tool URL paths. Empty string means show all.',
  defaultValue: '',
  options: [
    { value: '', label: 'All tools' },
    { value: '[]', label: 'No tools' },
  ],
  adapter: vercelAdapter(),
});
