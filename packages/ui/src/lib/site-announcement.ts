export type SiteAnnouncementState = 'info' | 'success' | 'warning' | 'error';

export interface SiteAnnouncement {
  state: SiteAnnouncementState;
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  /** ISO 8601 instant before which the banner stays hidden. */
  startsAt?: string;
  /** ISO 8601 instant after which the banner stays hidden. */
  endsAt?: string;
}

/** Flag key holding the announcement shown on every app. */
export const SITE_BANNER_FLAG_KEY = 'site-banner';

/** Apps that can be targeted individually, alongside the global announcement. */
export const SITE_BANNER_APPS = ['web', 'admin', 'insight', 'pulse'] as const;

export type SiteBannerApp = (typeof SITE_BANNER_APPS)[number];

/**
 * Flag key holding the announcement for a single app, e.g. `site-banner:pulse`.
 * An app-specific announcement takes precedence over the global one.
 */
export function siteBannerKey(app: SiteBannerApp): string {
  return `${SITE_BANNER_FLAG_KEY}:${app}`;
}

const ANNOUNCEMENT_STATES: SiteAnnouncementState[] = [
  'info',
  'success',
  'warning',
  'error',
];

/**
 * Parses a `site-banner` flag value into a {@link SiteAnnouncement}.
 *
 * Flag value must be a JSON object:
 *   { "state": "warning", "title": "Maintenance", "message": "...", "actionLabel"?: "...", "actionHref"?: "..." }
 *
 * - Empty string or malformed/invalid JSON → `null` (banner hidden)
 * - `state` missing or not a recognized value → defaults to `"info"`
 * - `actionLabel`/`actionHref` are only used as a pair; if either is missing, no action is shown
 * - `startsAt`/`endsAt` are passed through untouched; scheduling is applied by
 *   {@link resolveScheduledAnnouncement}, not here
 */
export function parseAnnouncementBanner(
  value: string
): SiteAnnouncement | null {
  if (!value) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    console.error(
      '[flags] site-banner: malformed JSON value "%s" — hiding banner',
      value
    );
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    console.error(
      '[flags] site-banner: expected a JSON object, got %s — hiding banner',
      JSON.stringify(parsed)
    );
    return null;
  }

  const { state, title, message, actionLabel, actionHref, startsAt, endsAt } =
    parsed as Record<string, unknown>;

  if (typeof message !== 'string' || !message.trim()) {
    console.error(
      '[flags] site-banner: "message" must be a non-empty string — hiding banner'
    );
    return null;
  }

  let resolvedState: SiteAnnouncementState = 'info';
  if (state !== undefined) {
    if (
      typeof state === 'string' &&
      ANNOUNCEMENT_STATES.includes(state as SiteAnnouncementState)
    ) {
      resolvedState = state as SiteAnnouncementState;
    } else {
      console.error(
        '[flags] site-banner: "state" must be one of %s, got %s — defaulting to "info"',
        ANNOUNCEMENT_STATES.join(', '),
        JSON.stringify(state)
      );
    }
  }

  const hasAction =
    typeof actionLabel === 'string' && typeof actionHref === 'string';

  return {
    state: resolvedState,
    title: typeof title === 'string' ? title : undefined,
    message,
    actionLabel: hasAction ? (actionLabel as string) : undefined,
    actionHref: hasAction ? (actionHref as string) : undefined,
    startsAt: typeof startsAt === 'string' ? startsAt : undefined,
    endsAt: typeof endsAt === 'string' ? endsAt : undefined,
  };
}

/**
 * Reads an ISO 8601 instant, returning `null` when absent or unparseable.
 * An unusable bound is treated as "no bound" rather than hiding the banner.
 */
function parseInstant(value: string | undefined, field: string): number | null {
  if (!value) return null;

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    console.error(
      '[flags] site-banner: "%s" is not a valid date (%s) — ignoring it',
      field,
      value
    );
    return null;
  }

  return time;
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
  const startsAt = parseInstant(announcement.startsAt, 'startsAt');
  const endsAt = parseInstant(announcement.endsAt, 'endsAt');

  if (startsAt !== null && at < startsAt) return false;
  if (endsAt !== null && at > endsAt) return false;

  return true;
}

/**
 * Applies the schedule window to a raw `site-banner` value, returning the value
 * unchanged while the announcement is active and `''` (hidden) otherwise.
 *
 * Call this where flags are resolved — server-side, in the root layout — rather
 * than inside `SiteBanner`. Evaluating the window during render on both server
 * and client risks a hydration mismatch when a bound falls between the two.
 * The trade-off is that an already-open page picks up a scheduled start on its
 * next navigation or reload, not on a timer.
 *
 * Values that fail to parse resolve to `''` so the error is logged once here
 * instead of again on the client.
 */
export function resolveScheduledAnnouncement(
  value: string,
  now: Date = new Date()
): string {
  const announcement = parseAnnouncementBanner(value);
  if (!announcement) return '';

  return isAnnouncementActive(announcement, now) ? value : '';
}
