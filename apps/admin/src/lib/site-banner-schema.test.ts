import { announcementSchema } from '@workspace/ui/lib/site-announcement';

import {
  isoToLocalInput,
  localInputToIso,
  siteBannerFormSchema,
  siteBannerRequestSchema,
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
      startsAt: '2026-09-01T22:30',
    });

    expect(announcement?.startsAt).toBe(localInputToIso('2026-09-01T22:30'));
    expect(announcement?.endsAt).toBeUndefined();
  });
});

describe('toFormValues', () => {
  it('round-trips a serialized banner back into the form', () => {
    const withAction: SiteBannerFormValues = {
      ...base,
      actionLabel: 'Status page',
      actionHref: 'https://status.elevensys.dev',
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
