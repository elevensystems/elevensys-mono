import type { TokenProps } from '@workspace/ui/components/token';
import {
  SITE_ANNOUNCEMENT_STATES,
  SITE_BANNER_APPS,
  SITE_BANNER_ITEM_KEY,
  type SiteAnnouncement,
  type SiteAnnouncementState,
  announcementSchema,
} from '@workspace/ui/lib/site-announcement';
import { z } from 'zod';

import type { SiteBannerTarget } from '@/types/site-banner';

export const SITE_BANNER_STATES = SITE_ANNOUNCEMENT_STATES;

/** Tags this feature's entries in the shared audit log. */
export const SITE_BANNER_FEATURE = SITE_BANNER_ITEM_KEY;

const TARGET_VALUES = ['all', ...SITE_BANNER_APPS] as const;

/** Every target the editor can write, in display order. */
export const SITE_BANNER_TARGETS: SiteBannerTarget[] = [...TARGET_VALUES];

export const TARGET_LABELS: Record<SiteBannerTarget, string> = {
  all: 'All apps',
  web: 'Web',
  admin: 'Admin',
  insight: 'Insight',
  pulse: 'Pulse',
};

export const STATE_LABELS: Record<SiteAnnouncementState, string> = {
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  promo: 'Promo',
};

/** Badge colour for each state, for the banner list in the picker. */
export const STATE_TOKEN_COLORS: Record<
  SiteAnnouncementState,
  NonNullable<TokenProps['color']>
> = {
  info: 'blue',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  promo: 'purple',
};

/** Swatch fill for each state, for the style picker above the composer. */
export const STATE_SWATCHES: Record<SiteAnnouncementState, string> = {
  info: 'bg-banner-info-bg',
  success: 'bg-banner-success-bg',
  warning: 'bg-banner-warning-bg',
  error: 'bg-banner-error-bg',
  promo: 'bg-banner-promo-bg',
};

/** Form state. Every field is a string so inputs stay controlled. */
export interface SiteBannerFormValues {
  target: SiteBannerTarget;
  /**
   * Which announcement in the target's list is being edited, or `''` for a
   * draft that has never been saved — it gets its id on submit.
   */
  id: string;
  enabled: boolean;
  state: SiteAnnouncementState;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  /**
   * Whether readers may close the banner themselves. Off by default: an
   * outage notice should stay on screen until staff take it down.
   */
  dismissible: boolean;
  /**
   * Which half of the timing control is selected. Off, the banner goes live as
   * soon as it is saved and the window is dropped rather than merely hidden,
   * so switching back to "Live now" actually clears the schedule.
   */
  scheduled: boolean;
  /** `datetime-local` value in the admin's own timezone, not an ISO instant. */
  startsAt: string;
  endsAt: string;
}

export const EMPTY_FORM_VALUES: Omit<SiteBannerFormValues, 'target' | 'id'> = {
  enabled: false,
  state: 'info',
  title: '',
  message: '',
  actionLabel: '',
  actionHref: '',
  dismissible: false,
  scheduled: false,
  startsAt: '',
  endsAt: '',
};

/** Absolute URL or a root-relative path. Anything else is a typo. */
function isUsableHref(href: string): boolean {
  if (href.startsWith('/')) return true;
  try {
    const { protocol } = new URL(href);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates the editor form. A disabled banner clears the announcement, so its
 * content is not validated — an admin turning a banner off should not have to
 * fix its message first.
 */
export const siteBannerFormSchema = z
  .object({
    target: z.enum(TARGET_VALUES),
    id: z.string(),
    enabled: z.boolean(),
    state: z.enum(SITE_BANNER_STATES),
    title: z.string(),
    message: z.string(),
    actionLabel: z.string(),
    actionHref: z.string(),
    dismissible: z.boolean(),
    scheduled: z.boolean(),
    startsAt: z.string(),
    endsAt: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.enabled) return;

    if (!values.message.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['message'],
        message: 'Message is required.',
      });
    }

    const hasLabel = Boolean(values.actionLabel.trim());
    const hasHref = Boolean(values.actionHref.trim());

    if (hasLabel !== hasHref) {
      ctx.addIssue({
        code: 'custom',
        path: [hasLabel ? 'actionHref' : 'actionLabel'],
        message: 'Provide both a button label and a link, or neither.',
      });
    }

    if (hasHref && !isUsableHref(values.actionHref.trim())) {
      ctx.addIssue({
        code: 'custom',
        path: ['actionHref'],
        message: 'Use a full https:// URL or a path starting with "/".',
      });
    }

    if (values.scheduled && values.startsAt && values.endsAt) {
      const start = new Date(values.startsAt).getTime();
      const end = new Date(values.endsAt).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
        ctx.addIssue({
          code: 'custom',
          path: ['endsAt'],
          message: 'End time must be after the start time.',
        });
      }
    }
  });

/**
 * Wire format for `POST /api/site-banner`. The announcement is validated with
 * the same schema the readers use, so a client bug cannot write a value the
 * apps would refuse to render.
 *
 * `id` says which announcement in the target's list is being written — an
 * unknown id appends a new one. A `null` announcement removes it.
 */
export const siteBannerRequestSchema = z.object({
  target: z.enum(TARGET_VALUES),
  id: z.string().min(1),
  announcement: announcementSchema.nullable(),
});

/**
 * A fresh id for an announcement being added.
 *
 * Call this when the save happens, never while building form values:
 * `useForm` re-applies its options on every render, so an id generated inside
 * `defaultValues` would differ each time and drive an infinite update loop.
 */
export function newAnnouncementId(): string {
  return crypto.randomUUID();
}

/** `datetime-local` (admin's local time) → ISO instant, or `undefined`. */
export function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

/** ISO instant → `datetime-local`, rendered in the admin's local time. */
export function isoToLocalInput(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * Form values → the stored announcement. A disabled banner resolves to `null`,
 * which is what hides it.
 */
export function toAnnouncement(
  values: SiteBannerFormValues
): SiteAnnouncement | null {
  if (!values.enabled || !values.message.trim()) return null;

  const hasAction = Boolean(
    values.actionLabel.trim() && values.actionHref.trim()
  );

  const announcement: SiteAnnouncement = {
    state: values.state,
    message: values.message.trim(),
  };

  const title = values.title.trim();
  if (title) announcement.title = title;
  if (hasAction) {
    announcement.actionLabel = values.actionLabel.trim();
    announcement.actionHref = values.actionHref.trim();
  }
  // Written only when on: absent and `false` mean the same thing, and leaving
  // it out keeps the stored value to what was actually asked for.
  if (values.dismissible) announcement.dismissible = true;

  if (values.scheduled) {
    const startsAt = localInputToIso(values.startsAt);
    const endsAt = localInputToIso(values.endsAt);
    if (startsAt) announcement.startsAt = startsAt;
    if (endsAt) announcement.endsAt = endsAt;
  }

  return announcement;
}

/**
 * Stored announcement → form values, for loading an existing one. Without an
 * announcement the form is a blank draft for a new banner, whose empty `id`
 * means "assign one on save", so saving appends rather than overwriting.
 *
 * Pure by contract: it feeds `useForm`'s `defaultValues`, which React
 * re-evaluates on every render, so a value that changed between calls would
 * loop forever.
 */
export function toFormValues(
  target: SiteBannerTarget,
  announcement: SiteAnnouncement | null | undefined
): SiteBannerFormValues {
  if (!announcement) return { target, id: '', ...EMPTY_FORM_VALUES };

  return {
    target,
    id: announcement.id ?? '',
    enabled: true,
    state: announcement.state,
    title: announcement.title ?? '',
    message: announcement.message,
    actionLabel: announcement.actionLabel ?? '',
    actionHref: announcement.actionHref ?? '',
    dismissible: announcement.dismissible ?? false,
    scheduled: Boolean(announcement.startsAt || announcement.endsAt),
    startsAt: isoToLocalInput(announcement.startsAt),
    endsAt: isoToLocalInput(announcement.endsAt),
  };
}

export interface SiteBannerPreset {
  id: string;
  /** Kept terse: the composer header row has to stay on one line. */
  label: string;
  values: Pick<
    SiteBannerFormValues,
    'state' | 'title' | 'message' | 'actionLabel' | 'actionHref' | 'dismissible'
  >;
}

/**
 * Starting points for the common announcements. They exist because a blank
 * textarea is the real reason banners go unwritten.
 */
export const SITE_BANNER_PRESETS: SiteBannerPreset[] = [
  {
    id: 'maintenance',
    label: 'Maintenance',
    values: {
      state: 'warning',
      title: 'Scheduled maintenance',
      message:
        'We will be performing scheduled maintenance and the service may be briefly unavailable. We apologize for the inconvenience.',
      actionLabel: '',
      actionHref: '',
      dismissible: false,
    },
  },
  {
    id: 'degraded',
    label: 'Degraded',
    values: {
      state: 'error',
      title: 'Service is experiencing issues',
      message:
        'We are currently experiencing stability issues, so some features may not work as expected. We are investigating and appreciate your patience.',
      actionLabel: '',
      actionHref: '',
      dismissible: false,
    },
  },
  {
    id: 'promo',
    label: 'Promo',
    values: {
      state: 'promo',
      title: 'Something new from Eleven Systems',
      message:
        'Take a look at what we have been building — new tools and updates are available now.',
      actionLabel: 'See what is new',
      actionHref: '/',
      // A promo is the one banner nobody should have to keep looking at.
      dismissible: true,
    },
  },
  {
    id: 'feature',
    label: 'New feature',
    values: {
      state: 'success',
      title: '',
      message: 'A new feature is now available. Take a look at what changed.',
      actionLabel: 'Learn more',
      actionHref: '/',
      // Nobody needs to be told twice about a feature.
      dismissible: true,
    },
  },
];

/**
 * Where an announcement sits relative to its schedule window.
 *
 * `unknown` is the pre-hydration answer: "now" is not the same instant on the
 * server as in the browser, so the first render deliberately says nothing about
 * liveness rather than risk a hydration mismatch.
 */
export type ScheduleStatus = 'live' | 'scheduled' | 'ended' | 'unknown';

export interface ScheduleSummary {
  status: ScheduleStatus;
  /** One line for the banner list and the preview caption. */
  label: string;
}

const scheduleFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** ISO instant → "Sep 6, 22:00" in the admin's local time, or `null`. */
function formatBound(value: string | undefined): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : scheduleFormatter.format(time);
}

type Scheduled = Pick<SiteAnnouncement, 'startsAt' | 'endsAt'>;

/**
 * Describes when an announcement shows, e.g. "Scheduled · Sep 6, 22:00 → Sep 7,
 * 02:00" or "Live now · no end date".
 *
 * `now` is the browser's clock as a timestamp, or `null` before the editor has
 * mounted — see `ScheduleStatus`.
 */
export function describeSchedule(
  announcement: Scheduled,
  now: number | null
): ScheduleSummary {
  const start = formatBound(announcement.startsAt);
  const end = formatBound(announcement.endsAt);
  const window = start && end ? `${start} → ${end}` : (start ?? end ?? null);

  if (now === null) {
    return { status: 'unknown', label: window ?? 'No schedule' };
  }

  const startsAt = announcement.startsAt
    ? Date.parse(announcement.startsAt)
    : Number.NaN;
  const endsAt = announcement.endsAt
    ? Date.parse(announcement.endsAt)
    : Number.NaN;

  if (!Number.isNaN(endsAt) && now > endsAt) {
    return { status: 'ended', label: `Ended ${end}` };
  }
  if (!Number.isNaN(startsAt) && now < startsAt) {
    return {
      status: 'scheduled',
      label: end
        ? `Scheduled · ${start} → ${end}`
        : `Scheduled · goes live ${start}`,
    };
  }

  return {
    status: 'live',
    label: end ? `Live now · until ${end}` : 'Live now · no end date',
  };
}

/**
 * One line describing everything posted on a target, e.g. "2 banners · 1 live,
 * 1 scheduled". Used by the target picker so staff can see where the noise is
 * without opening each target.
 */
export function summarizeTarget(
  announcements: SiteAnnouncement[] | undefined,
  now: number | null
): string {
  const count = announcements?.length ?? 0;
  if (count === 0) return 'Nothing posted';

  const noun = count === 1 ? '1 banner' : `${count} banners`;
  if (now === null) return noun;

  const statuses = (announcements ?? []).map(
    announcement => describeSchedule(announcement, now).status
  );
  const parts = (['live', 'scheduled', 'ended'] as const)
    .map(status => [status, statuses.filter(s => s === status).length] as const)
    .filter(([, n]) => n > 0)
    .map(([status, n]) => (count === 1 ? status : `${n} ${status}`));

  return parts.length > 0 ? `${noun} · ${parts.join(', ')}` : noun;
}
