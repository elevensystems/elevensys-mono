import { get } from '@vercel/global-config';
import {
  SITE_BANNER_ITEM_KEY,
  type SiteAnnouncement,
  type SiteBannerApp,
  resolveAnnouncements,
  sortAnnouncements,
} from '@workspace/ui/lib/site-announcement';

/**
 * Every announcement `app` should show, ready to hand to
 * `SiteAnnouncementProvider`: the ones targeted at every app plus the ones
 * targeted at this one, most urgent first.
 *
 * The schedule window is applied here — server-side, while the root layout
 * renders — rather than inside the client `SiteBanner`; see
 * `resolveAnnouncements` for why.
 *
 * Resolves to `[]` (no banners) when no store is connected or the read fails,
 * so an unreachable Global Config never takes an app down.
 */
export async function getSiteAnnouncements(
  app: SiteBannerApp
): Promise<SiteAnnouncement[]> {
  if (!process.env.GLOBAL_CONFIG && !process.env.EDGE_CONFIG) return [];

  try {
    // Read loosely: a target can legitimately be absent, and a hand-edited
    // store can hold anything. `resolveAnnouncements` decides what is usable.
    const config = await get<Record<string, unknown>>(SITE_BANNER_ITEM_KEY);

    return sortAnnouncements([
      ...resolveAnnouncements(config?.all),
      ...resolveAnnouncements(config?.[app]),
    ]);
  } catch (error) {
    // Next signals control flow — a prerender bailing out to dynamic rendering
    // above all, since this read is uncached — by throwing an error carrying a
    // `digest`. Let those through; only a real read failure hides the banners.
    if (typeof (error as { digest?: unknown })?.digest === 'string')
      throw error;

    console.error('[site-banner] could not read Global Config:', error);
    return [];
  }
}
