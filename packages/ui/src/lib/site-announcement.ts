import { z } from 'zod';

/** Global Config item holding the announcement, keyed by target app. */
export const SITE_BANNER_ITEM_KEY = 'site-banner';

/** Apps that can be targeted individually, alongside the global announcement. */
export const SITE_BANNER_APPS = ['web', 'admin', 'insight', 'pulse'] as const;

export type SiteBannerApp = (typeof SITE_BANNER_APPS)[number];

export const SITE_ANNOUNCEMENT_STATES = [
  'info',
  'success',
  'warning',
  'error',
] as const;

export type SiteAnnouncementState = (typeof SITE_ANNOUNCEMENT_STATES)[number];

const announcementObject = z.object({
  /**
   * Stable identifier, so the editor can address one announcement in a target's
   * list and React can key the stack. Optional: a hand-written entry without
   * one still renders, it just cannot be edited in place.
   */
  id: z.string().min(1).optional().catch(undefined),
  /**
   * When this announcement was last saved. Breaks ties when several banners
   * share a severity. Optional, and a missing value sorts oldest.
   */
  savedAt: z.iso.datetime().optional().catch(undefined),
  /** Unknown or missing values fall back to `info` rather than hiding the banner. */
  state: z.enum(SITE_ANNOUNCEMENT_STATES).catch('info'),
  title: z.string().trim().min(1).optional(),
  message: z.string().trim().min(1),
  actionLabel: z.string().trim().min(1).optional(),
  actionHref: z.string().trim().min(1).optional(),
  /**
   * ISO 8601 instants bounding when the banner shows. An unusable bound is
   * treated as "no bound" rather than hiding the banner outright.
   */
  startsAt: z.iso.datetime().optional().catch(undefined),
  endsAt: z.iso.datetime().optional().catch(undefined),
});

export type SiteAnnouncement = z.infer<typeof announcementObject>;

/**
 * The announcement stored under each target key.
 *
 * `message` is the only required field; without one there is nothing to show,
 * so a blank message is how an announcement is switched off. `actionLabel` and
 * `actionHref` are only useful as a pair — an unmatched half is dropped.
 */
export const announcementSchema = announcementObject.transform(
  (announcement): SiteAnnouncement =>
    announcement.actionLabel && announcement.actionHref
      ? announcement
      : { ...announcement, actionLabel: undefined, actionHref: undefined }
);

/**
 * Whole `site-banner` item: the announcements for each target. A target with
 * nothing to say is absent — "off" and "absent" are the same state.
 *
 * An app shows every `all` announcement plus every one targeted at it, so the
 * two lists add up rather than one replacing the other.
 */
export type SiteBannerConfig = Partial<
  Record<SiteBannerApp | 'all', SiteAnnouncement[]>
>;

/**
 * Validates one stored announcement. A malformed value logs and resolves to
 * `null` (banner hidden) rather than breaking the page that reads it.
 */
export function parseAnnouncement(value: unknown): SiteAnnouncement | null {
  if (value === null || value === undefined) return null;

  const result = announcementSchema.safeParse(value);
  if (!result.success) {
    console.error(
      '[site-banner] invalid announcement %s — hiding banner: %s',
      JSON.stringify(value),
      result.error.issues.map(issue => issue.message).join('; ')
    );
    return null;
  }

  return result.data;
}

/**
 * Returns `true` when `announcement` should be visible at `now`.
 *
 * A missing bound is open-ended: no `startsAt` means "already started", no
 * `endsAt` means "never expires".
 */
export function isAnnouncementActive(
  announcement: SiteAnnouncement,
  now: Date = new Date()
): boolean {
  const at = now.getTime();

  if (announcement.startsAt && at < Date.parse(announcement.startsAt))
    return false;
  if (announcement.endsAt && at > Date.parse(announcement.endsAt)) return false;

  return true;
}

/**
 * How urgent each state is. Banners are stacked most urgent first so a feature
 * announcement can never bury an outage notice. `success` and `info` share a
 * tier — neither is more urgent than the other.
 */
const STATE_RANK: Record<SiteAnnouncementState, number> = {
  error: 0,
  warning: 1,
  success: 2,
  info: 2,
};

/**
 * Stacking order: most urgent first, then most recently saved. An announcement
 * with no `savedAt` sorts last within its tier.
 */
export function sortAnnouncements(
  announcements: SiteAnnouncement[]
): SiteAnnouncement[] {
  return [...announcements].sort((a, b) => {
    const byState = STATE_RANK[a.state] - STATE_RANK[b.state];
    if (byState !== 0) return byState;

    return (
      (b.savedAt ? Date.parse(b.savedAt) : 0) -
      (a.savedAt ? Date.parse(a.savedAt) : 0)
    );
  });
}

/**
 * Validates a target's stored list, drops anything unusable or outside its
 * schedule window, and returns what is left in stacking order.
 *
 * Call this where announcements are read — server-side, in the root layout —
 * rather than inside `SiteBanner`. Evaluating the window during render on both
 * server and client risks a hydration mismatch when a bound falls between the
 * two. The trade-off is that an already-open page picks up a scheduled start on
 * its next navigation or reload, not on a timer.
 */
export function resolveAnnouncements(
  values: unknown,
  now: Date = new Date()
): SiteAnnouncement[] {
  if (!Array.isArray(values)) return [];

  const active = values
    .map(parseAnnouncement)
    .filter(
      (announcement): announcement is SiteAnnouncement =>
        announcement !== null && isAnnouncementActive(announcement, now)
    );

  return sortAnnouncements(active);
}
