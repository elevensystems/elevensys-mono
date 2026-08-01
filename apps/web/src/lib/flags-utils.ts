import type {
  SiteAnnouncement,
  SiteAnnouncementState,
} from '@/types/site-announcement';

const ANNOUNCEMENT_STATES: SiteAnnouncementState[] = [
  'info',
  'success',
  'warning',
  'error',
];

/**
 * Parses the `sidebar-tools` flag value into an allowlist of tool URL paths.
 *
 * Flag value must be a JSON array of tool URL paths:
 *   ["/tools/passly", "/tools/urlify"]
 *
 * - Flag empty → `null` (show all tools)
 * - `[]`       → `[]`   (hide all tools)
 * - `["/tools/passly", ...]` → show only those tools
 */
export function getVisibleToolPaths(visibleTools: string): string[] | null {
  if (!visibleTools) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(visibleTools);
  } catch {
    console.error(
      '[flags] sidebar-tools: malformed JSON value "%s" — showing all tools',
      visibleTools
    );
    return null;
  }

  // `""` is the Vercel "All tools" variant — treat as unset.
  if (parsed === '') return null;

  if (
    !Array.isArray(parsed) ||
    !parsed.every(item => typeof item === 'string')
  ) {
    console.error(
      '[flags] sidebar-tools: expected a JSON array of tool paths, got %s — showing all tools',
      JSON.stringify(parsed)
    );
    return null;
  }

  return parsed;
}

/**
 * Parses the `site-banner` flag value into a {@link SiteAnnouncement}.
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

  return {
    state: resolvedState,
    title: typeof title === 'string' ? title : undefined,
    message,
    actionLabel:
      typeof actionLabel === 'string' && typeof actionHref === 'string'
        ? actionLabel
        : undefined,
    actionHref:
      typeof actionLabel === 'string' && typeof actionHref === 'string'
        ? actionHref
        : undefined,
  };
}
