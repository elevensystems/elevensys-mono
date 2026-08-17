export type SiteAnnouncementState = 'info' | 'success' | 'warning' | 'error';

export interface SiteAnnouncement {
  state: SiteAnnouncementState;
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

/** Flag key every app reads its site-wide announcement from. */
export const SITE_BANNER_FLAG_KEY = 'site-banner';

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

  const { state, title, message, actionLabel, actionHref } = parsed as Record<
    string,
    unknown
  >;

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
  };
}
