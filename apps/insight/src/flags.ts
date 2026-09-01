import { globalConfigAdapter } from '@flags-sdk/global-config';
import {
  SITE_BANNER_FLAG_KEY,
  siteBannerKey,
} from '@workspace/ui/lib/site-announcement';
import { flag } from 'flags/next';

/**
 * `globalConfigAdapter()` throws while this module is evaluated when no Global
 * Config store is connected, which would fail the build. Until one is
 * provisioned, fall back to each flag's default value so the app behaves as if
 * the announcement were simply unset.
 *
 * Vercel injects `EDGE_CONFIG` when a store is connected and `GLOBAL_CONFIG`
 * under the newer name; the adapter reads either, so the guard checks both.
 */
const globalConfigProvisioned = Boolean(
  process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG
);

const ANNOUNCEMENT_DESCRIPTION =
  'Site-wide announcement/maintenance banner. JSON object: {"state","title"?,"message","actionLabel"?,"actionHref"?,"startsAt"?,"endsAt"?}. Empty string hides the banner. Edited from the admin app at /flags/site-banner.';

/** Announcement shown on every app unless that app has its own. */
export const siteBannerFlag = flag<string>({
  key: SITE_BANNER_FLAG_KEY,
  description: ANNOUNCEMENT_DESCRIPTION,
  defaultValue: '',
  options: [{ value: '', label: 'Hidden' }],
  ...(globalConfigProvisioned
    ? { adapter: globalConfigAdapter() }
    : { decide: () => '' }),
});

/** Announcement shown only on this app. Takes precedence over the global one. */
export const appSiteBannerFlag = flag<string>({
  key: siteBannerKey('insight'),
  description: `${ANNOUNCEMENT_DESCRIPTION} Scoped to the insight app.`,
  defaultValue: '',
  options: [{ value: '', label: 'Hidden' }],
  ...(globalConfigProvisioned
    ? { adapter: globalConfigAdapter() }
    : { decide: () => '' }),
});
