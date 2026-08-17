import { vercelAdapter } from '@flags-sdk/vercel';
import { flag } from 'flags/next';

/**
 * `vercelAdapter()` reads the `FLAGS` env var while this module is evaluated
 * and throws when the project has no Vercel Flags integration provisioned,
 * which fails the build. Until an environment is provisioned, fall back to the
 * flag's default value so the app behaves as if the flag were simply unset.
 */
const flagsProvisioned = Boolean(process.env.FLAGS);

export const siteBannerFlag = flag<string>({
  key: 'site-banner',
  description:
    'Site-wide announcement/maintenance banner. JSON object: {"state","title"?,"message","actionLabel"?,"actionHref"?}. Empty string hides the banner.',
  defaultValue: '',
  options: [{ value: '', label: 'Hidden' }],
  ...(flagsProvisioned ? { adapter: vercelAdapter() } : { decide: () => '' }),
});
