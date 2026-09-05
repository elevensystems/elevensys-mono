/**
 * The one behaviour worth pinning here: a save must touch only this feature's
 * Global Config item. The previous format rebuilt the shared `flags` item on
 * every write, which would silently drop `apps/web`'s `sidebar-tools` flag.
 */
import { writeSiteBannerValue } from '@/lib/global-config-admin';

jest.mock('@vercel/global-config', () => ({
  createClient: () => ({ connection: { id: 'ecfg_test' } }),
}));

jest.mock('@/env', () => ({
  env: {
    GLOBAL_CONFIG: 'https://edge-config.vercel.com/ecfg_test?token=t',
    VERCEL_API_TOKEN: 'token',
    VERCEL_TEAM_ID: undefined,
  },
}));

const ANNOUNCEMENT = { state: 'warning', message: 'Heads up' } as const;

/** Items already in the store, including one owned by another feature. */
const EXISTING_ITEMS = [
  { key: 'flags', value: { 'sidebar-tools': '["/tools/passly"]' } },
  {
    key: 'site-banner',
    value: {
      web: [
        { id: 'web-1', state: 'info', message: 'Old' },
        { id: 'web-2', state: 'error', message: 'Outage' },
      ],
      // A target holding exactly one announcement, so removing it empties it.
      insight: [{ id: 'insight-1', state: 'info', message: 'Only one' }],
    },
  },
  { key: 'config-audit', value: [] },
];

function mockStore() {
  const fetchMock = jest.fn().mockImplementation((_url, init?: RequestInit) =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify(init?.method === 'PATCH' ? {} : EXISTING_ITEMS),
    })
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** The PATCH body, keyed by the item each operation writes. */
function writtenItems(fetchMock: jest.Mock) {
  const patch = fetchMock.mock.calls.find(
    ([, init]) => (init as RequestInit)?.method === 'PATCH'
  );
  const { items } = JSON.parse(String((patch?.[1] as RequestInit).body)) as {
    items: { key: string; value: unknown }[];
  };
  return Object.fromEntries(items.map(item => [item.key, item.value]));
}

describe('writeSiteBannerValue', () => {
  it('writes only the site-banner and audit items, never `flags`', async () => {
    const fetchMock = mockStore();

    await writeSiteBannerValue({
      target: 'pulse',
      id: 'pulse-1',
      announcement: { ...ANNOUNCEMENT },
      by: 'admin',
    });

    expect(Object.keys(writtenItems(fetchMock)).sort()).toEqual([
      'config-audit',
      'site-banner',
    ]);
  });

  it('leaves other targets alone when writing one', async () => {
    const fetchMock = mockStore();

    await writeSiteBannerValue({
      target: 'pulse',
      id: 'pulse-1',
      announcement: { ...ANNOUNCEMENT },
      by: 'admin',
    });

    expect(writtenItems(fetchMock)['site-banner']).toMatchObject({
      web: [{ id: 'web-2' }, { id: 'web-1' }],
      pulse: [{ id: 'pulse-1', message: 'Heads up' }],
    });
  });

  it('appends a new announcement without disturbing the target\u2019s others', async () => {
    const fetchMock = mockStore();

    await writeSiteBannerValue({
      target: 'web',
      id: 'web-3',
      announcement: { ...ANNOUNCEMENT },
      by: 'admin',
    });

    const web = (
      writtenItems(fetchMock)['site-banner'] as Record<string, { id: string }[]>
    ).web;
    expect(web.map(entry => entry.id).sort()).toEqual([
      'web-1',
      'web-2',
      'web-3',
    ]);
  });

  it('replaces an announcement in place when the id already exists', async () => {
    const fetchMock = mockStore();

    await writeSiteBannerValue({
      target: 'web',
      id: 'web-1',
      announcement: { ...ANNOUNCEMENT },
      by: 'admin',
    });

    const web = (
      writtenItems(fetchMock)['site-banner'] as Record<
        string,
        { id: string; message: string }[]
      >
    ).web;
    expect(web).toHaveLength(2);
    expect(web.find(entry => entry.id === 'web-1')?.message).toBe('Heads up');
  });

  it('stamps id and savedAt server-side, never trusting the client', async () => {
    const fetchMock = mockStore();

    await writeSiteBannerValue({
      target: 'pulse',
      id: 'pulse-1',
      // A client trying to pin its own identity and ordering.
      announcement: {
        ...ANNOUNCEMENT,
        id: 'spoofed',
        savedAt: '1999-01-01T00:00:00.000Z',
      },
      by: 'admin',
    });

    const [saved] = (
      writtenItems(fetchMock)['site-banner'] as Record<
        string,
        { id: string; savedAt: string }[]
      >
    ).pulse;
    expect(saved?.id).toBe('pulse-1');
    expect(Date.parse(saved?.savedAt ?? '')).toBeGreaterThan(
      Date.parse('2020-01-01T00:00:00.000Z')
    );
  });

  it('removes one announcement and keeps the rest of the target', async () => {
    const fetchMock = mockStore();

    await writeSiteBannerValue({
      target: 'web',
      id: 'web-1',
      announcement: null,
      by: 'admin',
    });

    expect(writtenItems(fetchMock)['site-banner']).toMatchObject({
      web: [{ id: 'web-2' }],
    });
  });

  it('deletes an emptied target rather than storing an empty list', async () => {
    const fetchMock = mockStore();

    await writeSiteBannerValue({
      target: 'insight',
      id: 'insight-1',
      announcement: null,
      by: 'admin',
    });

    const config = writtenItems(fetchMock)['site-banner'];
    expect(config).not.toHaveProperty('insight');
    expect(config).toHaveProperty('web');
  });

  it('tags the audit entry with the feature it belongs to', async () => {
    const fetchMock = mockStore();

    await writeSiteBannerValue({
      target: 'web',
      id: 'web-1',
      announcement: null,
      by: 'admin',
    });

    expect(writtenItems(fetchMock)['config-audit']).toMatchObject([
      { feature: 'site-banner', target: 'web', action: 'clear', by: 'admin' },
    ]);
  });
});
