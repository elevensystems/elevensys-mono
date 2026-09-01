import {
  SITE_BANNER_APPS,
  SITE_BANNER_FLAG_KEY,
  type SiteAnnouncement,
  type SiteAnnouncementState,
  siteBannerKey,
} from '@workspace/ui/lib/site-announcement';
import { z } from 'zod';

import type { SiteBannerTarget } from '@/types/site-banner';

export const SITE_BANNER_STATES = [
  'info',
  'success',
  'warning',
  'error',
] as const;

const TARGET_VALUES = ['all', ...SITE_BANNER_APPS] as const;

/** Every target the editor can write, in display order. */
export const SITE_BANNER_TARGETS: SiteBannerTarget[] = [...TARGET_VALUES];

/** Flag key an announcement for `target` is stored under. */
export function targetFlagKey(target: SiteBannerTarget): string {
  return target === 'all' ? SITE_BANNER_FLAG_KEY : siteBannerKey(target);
}

/** Newest-first change log length. Keeps the Global Config item small. */
export const HISTORY_LIMIT = 20;

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
};

/** Form state. Every field is a string so inputs stay controlled. */
export interface SiteBannerFormValues {
  target: SiteBannerTarget;
  enabled: boolean;
  state: SiteAnnouncementState;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  /** `datetime-local` value in the admin's own timezone, not an ISO instant. */
  startsAt: string;
  endsAt: string;
}

export const EMPTY_FORM_VALUES: Omit<SiteBannerFormValues, 'target'> = {
  enabled: false,
  state: 'info',
  title: '',
  message: '',
  actionLabel: '',
  actionHref: '',
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
    enabled: z.boolean(),
    state: z.enum(SITE_BANNER_STATES),
    title: z.string(),
    message: z.string(),
    actionLabel: z.string(),
    actionHref: z.string(),
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

    if (values.startsAt && values.endsAt) {
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
 * Wire format for `POST /api/flags/site-banner`. The client sends the already
 * serialized announcement so both sides agree on exactly one representation;
 * the server re-parses it so a client bug cannot write an unreadable value.
 */
export const siteBannerRequestSchema = z.object({
  target: z.enum(TARGET_VALUES),
  value: z.string().refine(value => {
    if (value === '') return true;
    try {
      const parsed = JSON.parse(value) as { message?: unknown };
      return typeof parsed.message === 'string' && parsed.message.trim() !== '';
    } catch {
      return false;
    }
  }, 'Value must be an empty string or JSON with a non-empty "message".'),
});

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
 * Form values → the raw flag value. A disabled banner serializes to `''`,
 * which is what hides it.
 */
export function toAnnouncementValue(values: SiteBannerFormValues): string {
  if (!values.enabled || !values.message.trim()) return '';

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

  const startsAt = localInputToIso(values.startsAt);
  const endsAt = localInputToIso(values.endsAt);
  if (startsAt) announcement.startsAt = startsAt;
  if (endsAt) announcement.endsAt = endsAt;

  return JSON.stringify(announcement);
}

/** Raw flag value → form values, for loading an existing announcement. */
export function toFormValues(
  target: SiteBannerTarget,
  raw: string
): SiteBannerFormValues {
  if (!raw) return { target, ...EMPTY_FORM_VALUES };

  let parsed: Partial<SiteAnnouncement>;
  try {
    parsed = JSON.parse(raw) as Partial<SiteAnnouncement>;
  } catch {
    return { target, ...EMPTY_FORM_VALUES };
  }

  const state = SITE_BANNER_STATES.includes(
    parsed.state as SiteAnnouncementState
  )
    ? (parsed.state as SiteAnnouncementState)
    : 'info';

  return {
    target,
    enabled: true,
    state,
    title: parsed.title ?? '',
    message: parsed.message ?? '',
    actionLabel: parsed.actionLabel ?? '',
    actionHref: parsed.actionHref ?? '',
    startsAt: isoToLocalInput(parsed.startsAt),
    endsAt: isoToLocalInput(parsed.endsAt),
  };
}

export interface SiteBannerPreset {
  id: string;
  label: string;
  values: Pick<
    SiteBannerFormValues,
    'state' | 'title' | 'message' | 'actionLabel' | 'actionHref'
  >;
}

/**
 * Starting points for the common announcements. They exist because a blank
 * textarea is the real reason banners go unwritten.
 */
export const SITE_BANNER_PRESETS: SiteBannerPreset[] = [
  {
    id: 'maintenance',
    label: 'Scheduled maintenance',
    values: {
      state: 'warning',
      title: 'Scheduled maintenance',
      message:
        'We will be performing scheduled maintenance and the service may be briefly unavailable. We apologize for the inconvenience.',
      actionLabel: '',
      actionHref: '',
    },
  },
  {
    id: 'degraded',
    label: 'Degraded service',
    values: {
      state: 'error',
      title: 'Service is experiencing issues',
      message:
        'We are currently experiencing stability issues, so some features may not work as expected. We are investigating and appreciate your patience.',
      actionLabel: '',
      actionHref: '',
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
    },
  },
];
