import { get } from '@vercel/global-config';

import { getVisibleToolPaths } from '@/lib/sidebar-tools-server';

jest.mock('@vercel/global-config', () => ({ get: jest.fn() }));

const mockGet = get as jest.MockedFunction<typeof get>;

describe('getVisibleToolPaths', () => {
  beforeEach(() => {
    mockGet.mockReset();
    process.env.GLOBAL_CONFIG = 'https://edge-config.vercel.com/ecfg?token=t';
  });

  afterEach(() => {
    delete process.env.GLOBAL_CONFIG;
  });

  it('returns the stored allowlist', async () => {
    mockGet.mockResolvedValue(['/tools/passly', '/tools/urlify']);

    await expect(getVisibleToolPaths()).resolves.toEqual([
      '/tools/passly',
      '/tools/urlify',
    ]);
  });

  it('returns null when the item is absent, showing every tool', async () => {
    mockGet.mockResolvedValue(undefined);

    await expect(getVisibleToolPaths()).resolves.toBeNull();
  });

  it('returns an empty list when every tool is hidden', async () => {
    mockGet.mockResolvedValue([]);

    await expect(getVisibleToolPaths()).resolves.toEqual([]);
  });

  // --- Fail open ---
  it('shows every tool without reading when no store is connected', async () => {
    delete process.env.GLOBAL_CONFIG;

    await expect(getVisibleToolPaths()).resolves.toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('shows every tool and logs when the read fails', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGet.mockRejectedValue(new Error('unreachable'));

    await expect(getVisibleToolPaths()).resolves.toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('rethrows Next control-flow errors so a prerender can bail out', async () => {
    const bailout = Object.assign(new Error('Dynamic server usage'), {
      digest: 'DYNAMIC_SERVER_USAGE',
    });
    mockGet.mockRejectedValue(bailout);

    await expect(getVisibleToolPaths()).rejects.toBe(bailout);
  });
});
