import { get } from '@vercel/global-config';
import { getSiteAnnouncement } from '@workspace/ui/lib/site-announcement-server';

jest.mock('@vercel/global-config', () => ({ get: jest.fn() }));

const mockGet = get as jest.MockedFunction<typeof get>;

const announcement = (message: string, extra: object = {}) =>
  JSON.stringify({ state: 'info', message, ...extra });

describe('getSiteAnnouncement', () => {
  beforeEach(() => {
    mockGet.mockReset();
    process.env.GLOBAL_CONFIG = 'https://edge-config.vercel.com/ecfg?token=t';
  });

  afterEach(() => {
    delete process.env.GLOBAL_CONFIG;
  });

  it('prefers the app-specific announcement over the global one', async () => {
    mockGet.mockResolvedValue({
      'site-banner': announcement('global'),
      'site-banner:admin': announcement('admin only'),
    });

    await expect(getSiteAnnouncement('admin')).resolves.toBe(
      announcement('admin only')
    );
  });

  it('falls back to the global announcement when the app one is empty', async () => {
    mockGet.mockResolvedValue({
      'site-banner': announcement('global'),
      'site-banner:admin': '',
    });

    await expect(getSiteAnnouncement('admin')).resolves.toBe(
      announcement('global')
    );
  });

  it('hides a scheduled announcement outside its window', async () => {
    mockGet.mockResolvedValue({
      'site-banner': announcement('later', {
        startsAt: '2999-01-01T00:00:00.000Z',
      }),
    });

    await expect(getSiteAnnouncement('admin')).resolves.toBe('');
  });

  it('returns an empty value without reading when no store is connected', async () => {
    delete process.env.GLOBAL_CONFIG;

    await expect(getSiteAnnouncement('admin')).resolves.toBe('');
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('rethrows Next control-flow errors so a prerender can bail out', async () => {
    const bailout = Object.assign(new Error('Dynamic server usage'), {
      digest: 'DYNAMIC_SERVER_USAGE',
    });
    mockGet.mockRejectedValue(bailout);

    await expect(getSiteAnnouncement('admin')).rejects.toBe(bailout);
  });

  it('returns an empty value and logs when the read fails', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error('unreachable'));

    await expect(getSiteAnnouncement('admin')).resolves.toBe('');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
