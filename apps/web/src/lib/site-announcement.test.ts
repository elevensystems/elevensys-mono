import { parseAnnouncementBanner } from '@workspace/ui/lib/site-announcement';

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
