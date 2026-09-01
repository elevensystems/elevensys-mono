import { parseAnnouncementBanner } from '@workspace/ui/lib/site-announcement';

import {
  isoToLocalInput,
  localInputToIso,
  siteBannerFormSchema,
  siteBannerRequestSchema,
  toAnnouncementValue,
  toFormValues,
} from '@/lib/site-banner-schema';
import type { SiteBannerFormValues } from '@/lib/site-banner-schema';

const base: SiteBannerFormValues = {
  target: 'pulse',
  enabled: true,
  state: 'warning',
  title: 'Jira DC is unstable',
  message: 'The "Find Dates" feature may not work. Please pick dates manually.',
  actionLabel: '',
  actionHref: '',
  startsAt: '',
  endsAt: '',
};

describe('toAnnouncementValue', () => {
  it('serializes a banner the shared parser accepts', () => {
    const value = toAnnouncementValue(base);

    expect(parseAnnouncementBanner(value)).toMatchObject({
      state: 'warning',
      title: 'Jira DC is unstable',
      message: base.message,
    });
  });

  it('escapes quotes so admins never have to', () => {
    const value = toAnnouncementValue(base);

    expect(value).toContain('\\"Find Dates\\"');
    expect(parseAnnouncementBanner(value)?.message).toContain('"Find Dates"');
  });

  it('returns an empty string when the banner is switched off', () => {
    expect(toAnnouncementValue({ ...base, enabled: false })).toBe('');
  });

  it('returns an empty string when the message is blank', () => {
    expect(toAnnouncementValue({ ...base, message: '   ' })).toBe('');
  });

  it('omits the title when it is blank', () => {
    const value = toAnnouncementValue({ ...base, title: '  ' });
    expect(JSON.parse(value)).not.toHaveProperty('title');
  });

  it('omits a half-filled action, which the parser would drop anyway', () => {
    const value = toAnnouncementValue({ ...base, actionLabel: 'Status page' });

    expect(JSON.parse(value)).not.toHaveProperty('actionLabel');
    expect(parseAnnouncementBanner(value)?.actionLabel).toBeUndefined();
  });

  it('keeps a complete action pair', () => {
    const value = toAnnouncementValue({
      ...base,
      actionLabel: 'Status page',
      actionHref: 'https://status.elevensys.dev',
    });

    expect(parseAnnouncementBanner(value)).toMatchObject({
      actionLabel: 'Status page',
      actionHref: 'https://status.elevensys.dev',
    });
  });

  it('trims surrounding whitespace', () => {
    const value = toAnnouncementValue({ ...base, message: '  Hello  ' });
    expect(parseAnnouncementBanner(value)?.message).toBe('Hello');
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
    const value = toAnnouncementValue({
      ...base,
      startsAt: '2026-09-01T22:30',
    });
    const parsed = parseAnnouncementBanner(value);

    expect(parsed?.startsAt).toBe(localInputToIso('2026-09-01T22:30'));
    expect(parsed).not.toHaveProperty('endsAt', expect.anything());
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

    expect(toFormValues('pulse', toAnnouncementValue(withAction))).toEqual(
      withAction
    );
  });

  it('produces an empty, disabled form for a hidden banner', () => {
    expect(toFormValues('web', '')).toMatchObject({
      target: 'web',
      enabled: false,
      state: 'info',
      message: '',
    });
  });

  it('falls back to an empty form for a malformed value', () => {
    expect(toFormValues('web', 'not json').enabled).toBe(false);
  });

  it('defaults an unrecognized state to "info"', () => {
    expect(toFormValues('web', '{"state":"neon","message":"Hi"}').state).toBe(
      'info'
    );
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
  it('accepts a serialized announcement', () => {
    const result = siteBannerRequestSchema.safeParse({
      target: 'pulse',
      value: toAnnouncementValue(base),
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty value, which clears the banner', () => {
    expect(
      siteBannerRequestSchema.safeParse({ target: 'all', value: '' }).success
    ).toBe(true);
  });

  it('rejects an unknown target', () => {
    expect(
      siteBannerRequestSchema.safeParse({ target: 'jira', value: '' }).success
    ).toBe(false);
  });

  it('rejects a value the shared parser could not read', () => {
    expect(
      siteBannerRequestSchema.safeParse({ target: 'all', value: 'not json' })
        .success
    ).toBe(false);

    expect(
      siteBannerRequestSchema.safeParse({
        target: 'all',
        value: '{"state":"info"}',
      }).success
    ).toBe(false);
  });
});
