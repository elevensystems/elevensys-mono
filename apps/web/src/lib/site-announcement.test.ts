import {
  SITE_BANNER_APPS,
  isAnnouncementActive,
  parseAnnouncementBanner,
  resolveScheduledAnnouncement,
  siteBannerKey,
} from '@workspace/ui/lib/site-announcement';

describe('parseAnnouncementBanner', () => {
  // --- Hidden / empty ---
  it('returns null for an empty string', () => {
    expect(parseAnnouncementBanner('')).toBeNull();
  });

  it('returns null and logs for malformed JSON', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseAnnouncementBanner('not json')).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns null and logs when the value is a JSON array', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseAnnouncementBanner('[]')).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns null and logs when "message" is missing', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseAnnouncementBanner('{"state":"warning"}')).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns null when "message" is blank', () => {
    expect(parseAnnouncementBanner('{"message":"   "}')).toBeNull();
  });

  // --- Valid payloads ---
  it('parses a minimal payload, defaulting state to "info"', () => {
    expect(parseAnnouncementBanner('{"message":"Hello"}')).toEqual({
      state: 'info',
      title: undefined,
      message: 'Hello',
      actionLabel: undefined,
      actionHref: undefined,
    });
  });

  it('parses a full payload', () => {
    expect(
      parseAnnouncementBanner(
        JSON.stringify({
          state: 'warning',
          title: 'Maintenance',
          message: 'Downtime Sat 2-4am UTC',
          actionLabel: 'Learn more',
          actionHref: '/status',
        })
      )
    ).toEqual({
      state: 'warning',
      title: 'Maintenance',
      message: 'Downtime Sat 2-4am UTC',
      actionLabel: 'Learn more',
      actionHref: '/status',
    });
  });

  it('defaults to "info" and logs when "state" is not recognized', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(
      parseAnnouncementBanner('{"state":"critical","message":"Hi"}')?.state
    ).toBe('info');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('drops the action when only actionLabel is provided', () => {
    const result = parseAnnouncementBanner(
      '{"message":"Hi","actionLabel":"Go"}'
    );
    expect(result?.actionLabel).toBeUndefined();
    expect(result?.actionHref).toBeUndefined();
  });

  it('drops the action when only actionHref is provided', () => {
    const result = parseAnnouncementBanner(
      '{"message":"Hi","actionHref":"/x"}'
    );
    expect(result?.actionLabel).toBeUndefined();
    expect(result?.actionHref).toBeUndefined();
  });
});

describe('siteBannerKey', () => {
  it('namespaces the flag key per app', () => {
    expect(siteBannerKey('pulse')).toBe('site-banner:pulse');
    expect(siteBannerKey('web')).toBe('site-banner:web');
  });

  it('covers every targetable app', () => {
    expect(SITE_BANNER_APPS.map(siteBannerKey)).toEqual([
      'site-banner:web',
      'site-banner:admin',
      'site-banner:insight',
      'site-banner:pulse',
    ]);
  });
});

describe('isAnnouncementActive', () => {
  const announcement = { state: 'info' as const, message: 'Hello' };
  const now = new Date('2026-09-01T12:00:00.000Z');

  it('is active when no window is set', () => {
    expect(isAnnouncementActive(announcement, now)).toBe(true);
  });

  it('is inactive before startsAt', () => {
    expect(
      isAnnouncementActive(
        { ...announcement, startsAt: '2026-09-01T13:00:00.000Z' },
        now
      )
    ).toBe(false);
  });

  it('is active at exactly startsAt', () => {
    expect(
      isAnnouncementActive(
        { ...announcement, startsAt: '2026-09-01T12:00:00.000Z' },
        now
      )
    ).toBe(true);
  });

  it('is active inside the window', () => {
    expect(
      isAnnouncementActive(
        {
          ...announcement,
          startsAt: '2026-09-01T11:00:00.000Z',
          endsAt: '2026-09-01T13:00:00.000Z',
        },
        now
      )
    ).toBe(true);
  });

  it('is inactive after endsAt', () => {
    expect(
      isAnnouncementActive(
        { ...announcement, endsAt: '2026-09-01T11:59:59.000Z' },
        now
      )
    ).toBe(false);
  });

  it('ignores an unparseable bound rather than hiding the banner', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(
      isAnnouncementActive({ ...announcement, startsAt: 'tomorrow' }, now)
    ).toBe(true);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('resolveScheduledAnnouncement', () => {
  const now = new Date('2026-09-01T12:00:00.000Z');

  it('passes an unscheduled announcement through untouched', () => {
    const value = '{"state":"warning","message":"Jira is degraded"}';
    expect(resolveScheduledAnnouncement(value, now)).toBe(value);
  });

  it('hides an announcement that has not started', () => {
    const value =
      '{"message":"Maintenance tonight","startsAt":"2026-09-01T22:00:00.000Z"}';
    expect(resolveScheduledAnnouncement(value, now)).toBe('');
  });

  it('shows an announcement inside its window', () => {
    const value =
      '{"message":"Maintenance now","startsAt":"2026-09-01T11:00:00.000Z","endsAt":"2026-09-01T14:00:00.000Z"}';
    expect(resolveScheduledAnnouncement(value, now)).toBe(value);
  });

  it('hides an announcement that has expired', () => {
    const value =
      '{"message":"Maintenance done","endsAt":"2026-08-31T22:00:00.000Z"}';
    expect(resolveScheduledAnnouncement(value, now)).toBe('');
  });

  it('resolves an empty value to empty', () => {
    expect(resolveScheduledAnnouncement('', now)).toBe('');
  });

  it('resolves a malformed value to empty so it is logged only once', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(resolveScheduledAnnouncement('not json', now)).toBe('');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
