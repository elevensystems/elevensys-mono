import type { SiteAnnouncement } from '@workspace/ui/lib/site-announcement';
import {
  SITE_BANNER_APPS,
  isAnnouncementActive,
  parseAnnouncement,
  resolveAnnouncements,
  sortAnnouncements,
} from '@workspace/ui/lib/site-announcement';

const silenceErrors = () =>
  jest.spyOn(console, 'error').mockImplementation(() => {});

describe('parseAnnouncement', () => {
  // --- Hidden / empty ---
  it('returns null for a missing announcement', () => {
    expect(parseAnnouncement(null)).toBeNull();
    expect(parseAnnouncement(undefined)).toBeNull();
  });

  it('returns null and logs for a non-object value', () => {
    const spy = silenceErrors();
    expect(parseAnnouncement('not an announcement')).toBeNull();
    expect(parseAnnouncement([])).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns null and logs when "message" is missing', () => {
    const spy = silenceErrors();
    expect(parseAnnouncement({ state: 'warning' })).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns null when "message" is blank', () => {
    const spy = silenceErrors();
    expect(parseAnnouncement({ message: '   ' })).toBeNull();
    spy.mockRestore();
  });

  // --- Valid payloads ---
  it('parses a minimal payload, defaulting state to "info"', () => {
    expect(parseAnnouncement({ message: 'Hello' })).toEqual({
      state: 'info',
      title: undefined,
      message: 'Hello',
      actionLabel: undefined,
      actionHref: undefined,
      startsAt: undefined,
      endsAt: undefined,
    });
  });

  it('parses a full payload', () => {
    const announcement = {
      state: 'warning',
      title: 'Maintenance',
      message: 'Downtime Sat 2-4am UTC',
      actionLabel: 'Learn more',
      actionHref: '/status',
    };

    expect(parseAnnouncement(announcement)).toMatchObject(announcement);
  });

  it('trims surrounding whitespace', () => {
    expect(
      parseAnnouncement({ message: '  Hello  ', title: '  Hi  ' })
    ).toMatchObject({
      message: 'Hello',
      title: 'Hi',
    });
  });

  // --- Field-level fallbacks ---
  it('falls back to "info" for an unrecognized state rather than hiding', () => {
    expect(
      parseAnnouncement({ state: 'urgent', message: 'Hello' })
    ).toMatchObject({
      state: 'info',
      message: 'Hello',
    });
  });

  it('drops an action with only a label', () => {
    expect(
      parseAnnouncement({ message: 'Hello', actionLabel: 'Learn more' })
    ).toMatchObject({ actionLabel: undefined, actionHref: undefined });
  });

  it('drops an action with only a href', () => {
    expect(
      parseAnnouncement({ message: 'Hello', actionHref: '/status' })
    ).toMatchObject({ actionLabel: undefined, actionHref: undefined });
  });

  it('ignores an unparseable schedule bound instead of hiding the banner', () => {
    expect(
      parseAnnouncement({ message: 'Hello', startsAt: 'yesterday' })
    ).toMatchObject({
      message: 'Hello',
      startsAt: undefined,
    });
  });
});

describe('isAnnouncementActive', () => {
  const now = new Date('2026-09-05T12:00:00.000Z');
  const base = { state: 'info', message: 'Hello' } as const;

  it('is active with no bounds', () => {
    expect(isAnnouncementActive({ ...base }, now)).toBe(true);
  });

  it('is hidden before startsAt and visible after', () => {
    expect(
      isAnnouncementActive(
        { ...base, startsAt: '2026-09-05T13:00:00.000Z' },
        now
      )
    ).toBe(false);
    expect(
      isAnnouncementActive(
        { ...base, startsAt: '2026-09-05T11:00:00.000Z' },
        now
      )
    ).toBe(true);
  });

  it('is hidden after endsAt', () => {
    expect(
      isAnnouncementActive({ ...base, endsAt: '2026-09-05T11:00:00.000Z' }, now)
    ).toBe(false);
  });

  it('is active inside a closed window', () => {
    expect(
      isAnnouncementActive(
        {
          ...base,
          startsAt: '2026-09-05T11:00:00.000Z',
          endsAt: '2026-09-05T13:00:00.000Z',
        },
        now
      )
    ).toBe(true);
  });
});

describe('sortAnnouncements', () => {
  const at = (
    state: SiteAnnouncement['state'],
    savedAt: string
  ): SiteAnnouncement => ({ state, message: state + savedAt, savedAt });

  it('stacks the most urgent first', () => {
    const sorted = sortAnnouncements([
      at('info', '2026-09-01T00:00:00.000Z'),
      at('error', '2026-09-01T00:00:00.000Z'),
      at('warning', '2026-09-01T00:00:00.000Z'),
    ]);

    expect(sorted.map(a => a.state)).toEqual(['error', 'warning', 'info']);
  });

  it('keeps a promo below every other state, however recently saved', () => {
    const sorted = sortAnnouncements([
      at('promo', '2026-09-09T00:00:00.000Z'),
      at('info', '2026-09-01T00:00:00.000Z'),
      at('error', '2026-09-01T00:00:00.000Z'),
    ]);

    expect(sorted.map(a => a.state)).toEqual(['error', 'info', 'promo']);
  });

  it('puts the most recently saved first within one tier', () => {
    const sorted = sortAnnouncements([
      at('warning', '2026-09-01T00:00:00.000Z'),
      at('warning', '2026-09-03T00:00:00.000Z'),
      at('warning', '2026-09-02T00:00:00.000Z'),
    ]);

    expect(sorted.map(a => a.savedAt)).toEqual([
      '2026-09-03T00:00:00.000Z',
      '2026-09-02T00:00:00.000Z',
      '2026-09-01T00:00:00.000Z',
    ]);
  });

  it('treats success and info as equally urgent', () => {
    const sorted = sortAnnouncements([
      at('info', '2026-09-01T00:00:00.000Z'),
      at('success', '2026-09-02T00:00:00.000Z'),
    ]);

    expect(sorted.map(a => a.state)).toEqual(['success', 'info']);
  });

  it('sorts an announcement with no savedAt last in its tier', () => {
    const sorted = sortAnnouncements([
      { state: 'info', message: 'undated' },
      at('info', '2026-09-01T00:00:00.000Z'),
    ]);

    expect(sorted[0]?.savedAt).toBe('2026-09-01T00:00:00.000Z');
  });

  it('does not mutate the input', () => {
    const input = [
      at('info', '2026-09-01T00:00:00.000Z'),
      at('error', '2026-09-01T00:00:00.000Z'),
    ];
    sortAnnouncements(input);

    expect(input[0]?.state).toBe('info');
  });
});

describe('resolveAnnouncements', () => {
  const now = new Date('2026-09-05T12:00:00.000Z');

  it('returns an empty list for anything that is not an array', () => {
    expect(resolveAnnouncements(undefined, now)).toEqual([]);
    expect(resolveAnnouncements(null, now)).toEqual([]);
    expect(resolveAnnouncements({ message: 'Hello' }, now)).toEqual([]);
  });

  it('keeps every active announcement, in stacking order', () => {
    const resolved = resolveAnnouncements(
      [
        { state: 'info', message: 'Feature' },
        { state: 'error', message: 'Outage' },
      ],
      now
    );

    expect(resolved.map(a => a.message)).toEqual(['Outage', 'Feature']);
  });

  it('drops announcements outside their schedule window', () => {
    const resolved = resolveAnnouncements(
      [
        { state: 'info', message: 'Now' },
        {
          state: 'info',
          message: 'Later',
          startsAt: '2999-01-01T00:00:00.000Z',
        },
        { state: 'info', message: 'Over', endsAt: '2020-01-01T00:00:00.000Z' },
      ],
      now
    );

    expect(resolved.map(a => a.message)).toEqual(['Now']);
  });

  it('drops one invalid entry without losing the rest', () => {
    const spy = silenceErrors();
    const resolved = resolveAnnouncements(
      [{ state: 'info' }, { state: 'info', message: 'Good' }],
      now
    );

    expect(resolved.map(a => a.message)).toEqual(['Good']);
    spy.mockRestore();
  });
});

describe('SITE_BANNER_APPS', () => {
  it('lists every app that can be targeted', () => {
    expect(SITE_BANNER_APPS).toEqual(['web', 'admin', 'insight', 'pulse']);
  });
});
