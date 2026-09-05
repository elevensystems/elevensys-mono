import { get } from '@vercel/global-config';
import { getSiteAnnouncements } from '@workspace/ui/lib/site-announcement-server';

jest.mock('@vercel/global-config', () => ({ get: jest.fn() }));

const mockGet = get as jest.MockedFunction<typeof get>;

const announcement = (message: string, extra: object = {}) => ({
  state: 'info',
  message,
  ...extra,
});

describe('getSiteAnnouncements', () => {
  beforeEach(() => {
    mockGet.mockReset();
    process.env.GLOBAL_CONFIG = 'https://edge-config.vercel.com/ecfg?token=t';
  });

  afterEach(() => {
    delete process.env.GLOBAL_CONFIG;
  });

  it('shows the global and app-specific announcements together', async () => {
    mockGet.mockResolvedValue({
      all: [announcement('global')],
      admin: [announcement('admin only')],
    });

    await expect(getSiteAnnouncements('admin')).resolves.toMatchObject([
      { message: 'global' },
      { message: 'admin only' },
    ]);
  });

  it('shows every announcement targeted at one app', async () => {
    mockGet.mockResolvedValue({
      admin: [announcement('first'), announcement('second')],
    });

    await expect(getSiteAnnouncements('admin')).resolves.toHaveLength(2);
  });

  it('stacks the most urgent first across both lists', async () => {
    mockGet.mockResolvedValue({
      all: [announcement('feature', { state: 'info' })],
      admin: [announcement('outage', { state: 'error' })],
    });

    const resolved = await getSiteAnnouncements('admin');
    expect(resolved.map(a => a.message)).toEqual(['outage', 'feature']);
  });

  it('ignores announcements targeted at another app', async () => {
    mockGet.mockResolvedValue({ pulse: [announcement('pulse only')] });

    await expect(getSiteAnnouncements('admin')).resolves.toEqual([]);
  });

  it('returns an empty list when nothing is posted', async () => {
    mockGet.mockResolvedValue({});

    await expect(getSiteAnnouncements('admin')).resolves.toEqual([]);
  });

  it('hides a scheduled announcement outside its window', async () => {
    mockGet.mockResolvedValue({
      all: [
        announcement('now'),
        announcement('later', { startsAt: '2999-01-01T00:00:00.000Z' }),
      ],
    });

    await expect(getSiteAnnouncements('admin')).resolves.toMatchObject([
      { message: 'now' },
    ]);
  });

  it('returns an empty list without reading when no store is connected', async () => {
    delete process.env.GLOBAL_CONFIG;

    await expect(getSiteAnnouncements('admin')).resolves.toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('rethrows Next control-flow errors so a prerender can bail out', async () => {
    const bailout = Object.assign(new Error('Dynamic server usage'), {
      digest: 'DYNAMIC_SERVER_USAGE',
    });
    mockGet.mockRejectedValue(bailout);

    await expect(getSiteAnnouncements('admin')).rejects.toBe(bailout);
  });

  it('returns an empty list and logs when the read fails', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error('unreachable'));

    await expect(getSiteAnnouncements('admin')).resolves.toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
