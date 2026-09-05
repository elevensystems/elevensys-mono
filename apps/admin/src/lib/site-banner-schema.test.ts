import { announcementSchema } from '@workspace/ui/lib/site-announcement';

import {
  describeSchedule,
  isoToLocalInput,
  localInputToIso,
  siteBannerFormSchema,
  siteBannerRequestSchema,
  summarizeTarget,
  toAnnouncement,
  toFormValues,
} from '@/lib/site-banner-schema';
import type { SiteBannerFormValues } from '@/lib/site-banner-schema';

const base: SiteBannerFormValues = {
  target: 'pulse',
  id: 'pulse-1',
  enabled: true,
  state: 'warning',
  title: 'Jira DC is unstable',
  message: 'The "Find Dates" feature may not work. Please pick dates manually.',
  actionLabel: '',
  actionHref: '',
  dismissible: false,
  scheduled: false,
  startsAt: '',
  endsAt: '',
};

describe('toAnnouncement', () => {
  it('builds an announcement the shared schema accepts', () => {
    expect(announcementSchema.safeParse(toAnnouncement(base)).success).toBe(
      true
    );
    expect(toAnnouncement(base)).toMatchObject({
      state: 'warning',
      title: 'Jira DC is unstable',
      message: base.message,
    });
  });

  it('keeps quotes intact — nothing is serialized on the way out', () => {
    expect(toAnnouncement(base)?.message).toContain('"Find Dates"');
  });

  it('returns null when the banner is switched off', () => {
    expect(toAnnouncement({ ...base, enabled: false })).toBeNull();
  });

  it('returns null when the message is blank', () => {
    expect(toAnnouncement({ ...base, message: '   ' })).toBeNull();
  });

  it('omits the title when it is blank', () => {
    expect(toAnnouncement({ ...base, title: '  ' })).not.toHaveProperty(
      'title'
    );
  });

  it('omits a half-filled action, which the schema would drop anyway', () => {
    const announcement = toAnnouncement({
      ...base,
      actionLabel: 'Status page',
    });

    expect(announcement).not.toHaveProperty('actionLabel');
    expect(announcementSchema.parse(announcement)?.actionLabel).toBeUndefined();
  });

  it('keeps a complete action pair', () => {
    expect(
      toAnnouncement({
        ...base,
        actionLabel: 'Status page',
        actionHref: 'https://status.elevensys.dev',
      })
    ).toMatchObject({
      actionLabel: 'Status page',
      actionHref: 'https://status.elevensys.dev',
    });
  });

  it('trims surrounding whitespace', () => {
    expect(toAnnouncement({ ...base, message: '  Hello  ' })?.message).toBe(
      'Hello'
    );
  });
});

describe('the dismissible switch', () => {
  it('marks the announcement so readers can close it', () => {
    expect(toAnnouncement({ ...base, dismissible: true })).toMatchObject({
      dismissible: true,
    });
  });

  it('leaves the field out when it is off, since absent means the same', () => {
    expect(toAnnouncement(base)).not.toHaveProperty('dismissible');
  });

  it('reads back from a stored announcement', () => {
    expect(
      toFormValues('pulse', { state: 'info', message: 'hi', dismissible: true })
        .dismissible
    ).toBe(true);
  });

  it('is off for a banner saved without it', () => {
    expect(
      toFormValues('pulse', { state: 'info', message: 'hi' }).dismissible
    ).toBe(false);
  });
});

describe('schedule conversion', () => {
  it('round-trips a local input through ISO and back', () => {
    const local = '2026-09-01T22:30';
    const iso = localInputToIso(local);

    expect(iso).toBeDefined();
    expect(isoToLocalInput(iso)).toBe(local);
  });

  it('treats an empty or unparseable value as no bound', () => {
    expect(localInputToIso('')).toBeUndefined();
    expect(localInputToIso('tomorrow')).toBeUndefined();
    expect(isoToLocalInput(undefined)).toBe('');
    expect(isoToLocalInput('nonsense')).toBe('');
  });

  it('serializes the window as ISO instants', () => {
    const announcement = toAnnouncement({
      ...base,
      scheduled: true,
      startsAt: '2026-09-01T22:30',
    });

    expect(announcement?.startsAt).toBe(localInputToIso('2026-09-01T22:30'));
    expect(announcement?.endsAt).toBeUndefined();
  });
});

describe('the timing switch', () => {
  const window = {
    scheduled: true,
    startsAt: '2026-09-01T22:30',
    endsAt: '2026-09-02T02:00',
  };

  it('drops the window when the banner is set to go live now', () => {
    const announcement = toAnnouncement({
      ...base,
      ...window,
      scheduled: false,
    });

    expect(announcement?.startsAt).toBeUndefined();
    expect(announcement?.endsAt).toBeUndefined();
  });

  it('skips the end-after-start check while the window is off', () => {
    const result = siteBannerFormSchema.safeParse({
      ...base,
      ...window,
      scheduled: false,
      endsAt: '2026-08-01T00:00',
    });

    expect(result.success).toBe(true);
  });

  it('turns itself on for a stored banner that has a window', () => {
    expect(
      toFormValues('web', {
        id: 'web-1',
        state: 'info',
        message: 'Hello',
        startsAt: '2026-09-01T22:30:00.000Z',
      } as never).scheduled
    ).toBe(true);
  });

  it('stays off for a stored banner with no window', () => {
    expect(
      toFormValues('web', {
        id: 'web-1',
        state: 'info',
        message: 'Hello',
      } as never).scheduled
    ).toBe(false);
  });
});

describe('describeSchedule', () => {
  const at = (iso: string) => Date.parse(iso);
  const starts = '2026-09-06T22:00:00.000Z';
  const ends = '2026-09-07T02:00:00.000Z';

  it('reports an unbounded banner as live with no end date', () => {
    expect(describeSchedule({}, at('2026-09-05T00:00:00.000Z'))).toEqual({
      status: 'live',
      label: 'Live now · no end date',
    });
  });

  it('reports a window that has not opened yet as scheduled', () => {
    const summary = describeSchedule(
      { startsAt: starts, endsAt: ends },
      at('2026-09-05T00:00:00.000Z')
    );

    expect(summary.status).toBe('scheduled');
    expect(summary.label).toMatch(/^Scheduled · .+ → .+$/);
  });

  it('reports a window that is open as live', () => {
    expect(
      describeSchedule(
        { startsAt: starts, endsAt: ends },
        at('2026-09-06T23:00:00.000Z')
      ).status
    ).toBe('live');
  });

  it('reports a window that has closed as ended', () => {
    expect(
      describeSchedule(
        { startsAt: starts, endsAt: ends },
        at('2026-09-08T00:00:00.000Z')
      ).status
    ).toBe('ended');
  });

  it('claims nothing about liveness before the editor has mounted', () => {
    // "now" is not the same instant on the server as in the browser, so the
    // first render must not decide this.
    expect(
      describeSchedule({ startsAt: starts, endsAt: ends }, null).status
    ).toBe('unknown');
    expect(describeSchedule({}, null).label).toBe('No schedule');
  });

  it('ignores an unusable bound rather than rendering "Invalid Date"', () => {
    expect(describeSchedule({ startsAt: 'tomorrow' }, null).label).toBe(
      'No schedule'
    );
  });
});

describe('summarizeTarget', () => {
  const now = Date.parse('2026-09-05T00:00:00.000Z');
  const live = { state: 'info', message: 'a' } as never;
  const later = {
    state: 'info',
    message: 'b',
    startsAt: '2026-09-06T22:00:00.000Z',
  } as never;

  it('says nothing is posted for an empty target', () => {
    expect(summarizeTarget(undefined, now)).toBe('Nothing posted');
    expect(summarizeTarget([], now)).toBe('Nothing posted');
  });

  it('breaks a target down by status', () => {
    expect(summarizeTarget([live, later], now)).toBe(
      '2 banners · 1 live, 1 scheduled'
    );
  });

  it('drops the count for a single banner', () => {
    expect(summarizeTarget([live], now)).toBe('1 banner · live');
  });

  it('counts without claiming liveness before the editor has mounted', () => {
    expect(summarizeTarget([live, later], null)).toBe('2 banners');
  });
});

describe('toFormValues', () => {
  it('round-trips a serialized banner back into the form', () => {
    const withAction: SiteBannerFormValues = {
      ...base,
      actionLabel: 'Status page',
      actionHref: 'https://status.elevensys.dev',
      scheduled: true,
      startsAt: '2026-09-01T22:30',
      endsAt: '2026-09-02T02:00',
    };

    expect(
      toFormValues('pulse', {
        ...toAnnouncement(withAction),
        id: withAction.id,
      } as never)
    ).toEqual(withAction);
  });

  it('produces an empty, disabled draft for a target with no announcement', () => {
    expect(toFormValues('web', undefined)).toMatchObject({
      target: 'web',
      enabled: false,
      state: 'info',
      message: '',
    });
    expect(toFormValues('web', null).enabled).toBe(false);
  });

  it('leaves a new draft without an id, so saving appends', () => {
    expect(toFormValues('web', undefined).id).toBe('');
  });

  it('is pure — it feeds defaultValues, re-evaluated on every render', () => {
    // An id generated here would differ each render and loop forever.
    expect(toFormValues('web', undefined)).toEqual(
      toFormValues('web', undefined)
    );
  });

  it('keeps the id of an existing announcement, so saving replaces it', () => {
    expect(
      toFormValues('web', {
        id: 'web-1',
        state: 'info',
        message: 'Hello',
      } as never).id
    ).toBe('web-1');
  });
});

describe('siteBannerFormSchema', () => {
  it('accepts a valid banner', () => {
    expect(siteBannerFormSchema.safeParse(base).success).toBe(true);
  });

  it('requires a message when the banner is on', () => {
    const result = siteBannerFormSchema.safeParse({ ...base, message: '' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['message']);
  });

  it('skips validation when the banner is being switched off', () => {
    const result = siteBannerFormSchema.safeParse({
      ...base,
      enabled: false,
      message: '',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a half-filled action', () => {
    const result = siteBannerFormSchema.safeParse({
      ...base,
      actionLabel: 'Status page',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['actionHref']);
  });

  it('accepts a root-relative action link', () => {
    const result = siteBannerFormSchema.safeParse({
      ...base,
      actionLabel: 'Configure',
      actionHref: '/config',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an action link that is neither a URL nor a path', () => {
    const result = siteBannerFormSchema.safeParse({
      ...base,
      actionLabel: 'Configure',
      actionHref: 'status.elevensys.dev',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an end time at or before the start time', () => {
    const result = siteBannerFormSchema.safeParse({
      ...base,
      scheduled: true,
      startsAt: '2026-09-02T02:00',
      endsAt: '2026-09-01T22:30',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['endsAt']);
  });
});

describe('siteBannerRequestSchema', () => {
  it('accepts an announcement', () => {
    const result = siteBannerRequestSchema.safeParse({
      target: 'pulse',
      id: 'pulse-1',
      announcement: toAnnouncement(base),
    });

    expect(result.success).toBe(true);
  });

  it('accepts a null announcement, which removes that banner', () => {
    expect(
      siteBannerRequestSchema.safeParse({
        target: 'all',
        id: 'all-1',
        announcement: null,
      }).success
    ).toBe(true);
  });

  it('requires an id, since it says which banner is being written', () => {
    expect(
      siteBannerRequestSchema.safeParse({ target: 'all', announcement: null })
        .success
    ).toBe(false);

    expect(
      siteBannerRequestSchema.safeParse({
        target: 'all',
        id: '',
        announcement: null,
      }).success
    ).toBe(false);
  });

  it('rejects an unknown target', () => {
    expect(
      siteBannerRequestSchema.safeParse({
        target: 'jira',
        id: 'x',
        announcement: null,
      }).success
    ).toBe(false);
  });

  it('rejects an announcement the apps could not render', () => {
    expect(
      siteBannerRequestSchema.safeParse({
        target: 'all',
        id: 'all-1',
        announcement: { state: 'info' },
      }).success
    ).toBe(false);

    expect(
      siteBannerRequestSchema.safeParse({
        target: 'all',
        id: 'all-1',
        announcement: 'not an announcement',
      }).success
    ).toBe(false);
  });
});
