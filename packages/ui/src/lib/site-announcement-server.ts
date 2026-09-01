import { get } from '@vercel/global-config';
import {
  SITE_BANNER_FLAG_KEY,
  type SiteBannerApp,
  resolveScheduledAnnouncement,
  siteBannerKey,
} from '@workspace/ui/lib/site-announcement';

/**
 * Global Config item holding the announcement values, keyed by `site-banner`
 * and `site-banner:<app>`. Written by the admin editor at /flags/site-banner.
 */
const ANNOUNCEMENTS_ITEM_KEY = 'flags';

/**
 * Reads the announcement for `app`, ready to hand to `FlagsProvider` as
 * `{ 'site-banner': … }`. The app-specific value wins; an empty one falls back
 * to the announcement shown on every app.
 *
 * The schedule window is applied here — server-side, while the root layout
 * renders — rather than inside the client `SiteBanner`; see
 * `resolveScheduledAnnouncement` for why.
 *
 * Resolves to `''` (banner hidden) when no store is connected or the read
 * fails, so an unreachable Global Config never takes an app down.
 */
export async function getSiteAnnouncement(app: SiteBannerApp): Promise<string> {
  if (!process.env.GLOBAL_CONFIG && !process.env.EDGE_CONFIG) return '';

  try {
    const announcements = await get<Record<string, unknown>>(
      ANNOUNCEMENTS_ITEM_KEY
    );
    const value =
      announcements?.[siteBannerKey(app)] ||
      announcements?.[SITE_BANNER_FLAG_KEY];

    return typeof value === 'string' ? resolveScheduledAnnouncement(value) : '';
  } catch (error) {
    // Next signals control flow — a prerender bailing out to dynamic rendering
    // above all, since this read is uncached — by throwing an error carrying a
    // `digest`. Let those through; only a real read failure hides the banner.
    if (typeof (error as { digest?: unknown })?.digest === 'string')
      throw error;

    console.error('[site-banner] could not read Global Config:', error);
    return '';
  }
}
