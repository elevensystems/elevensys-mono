import { writeToolsVisibility } from '@/lib/tools-visibility-admin';

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

/** Items already in the store, including one owned by another feature. */
const EXISTING_ITEMS = [
  { key: 'site-banner', value: { web: [{ id: 'w1', message: 'Hi' }] } },
  { key: 'sidebar-tools', value: ['/tools/passly'] },
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

/** The operations in the PATCH body, keyed by item. */
function writtenOps(fetchMock: jest.Mock) {
  const patch = fetchMock.mock.calls.find(
    ([, init]) => (init as RequestInit)?.method === 'PATCH'
  );
  const { items } = JSON.parse(String((patch?.[1] as RequestInit).body)) as {
    items: { key: string; operation: string; value?: unknown }[];
  };
  return Object.fromEntries(items.map(item => [item.key, item]));
}

describe('writeToolsVisibility', () => {
  it("writes only its own item and the audit log, never another feature's", async () => {
    const fetchMock = mockStore();

    await writeToolsVisibility({ visible: ['/tools/urlify'], by: 'admin' });

    expect(Object.keys(writtenOps(fetchMock)).sort()).toEqual([
      'config-audit',
      'sidebar-tools',
    ]);
  });

  it('stores the allowlist when some tools are hidden', async () => {
    const fetchMock = mockStore();

    await writeToolsVisibility({
      visible: ['/tools/urlify', '/tools/passly'],
      by: 'admin',
    });

    expect(writtenOps(fetchMock)['sidebar-tools']).toMatchObject({
      operation: 'upsert',
      value: ['/tools/urlify', '/tools/passly'],
    });
  });

  it('deletes the item for "show everything", rather than listing every tool', async () => {
    // Storing every path would hide a tool shipped later; absence would not.
    const fetchMock = mockStore();

    await writeToolsVisibility({ visible: null, by: 'admin' });

    expect(writtenOps(fetchMock)['sidebar-tools']).toMatchObject({
      operation: 'delete',
    });
  });

  it('stores an empty list, which hides every tool', async () => {
    const fetchMock = mockStore();

    await writeToolsVisibility({ visible: [], by: 'admin' });

    expect(writtenOps(fetchMock)['sidebar-tools']).toMatchObject({
      operation: 'upsert',
      value: [],
    });
  });

  it('drops a path that is no longer a known tool', async () => {
    const fetchMock = mockStore();

    await writeToolsVisibility({
      visible: ['/tools/urlify', '/tools/retired'],
      by: 'admin',
    });

    expect(writtenOps(fetchMock)['sidebar-tools']).toMatchObject({
      value: ['/tools/urlify'],
    });
  });

  it('tags the audit entry with the feature it belongs to', async () => {
    const fetchMock = mockStore();

    await writeToolsVisibility({ visible: ['/tools/urlify'], by: 'admin' });

    expect(writtenOps(fetchMock)['config-audit']?.value).toMatchObject([
      { feature: 'sidebar-tools', action: 'save', by: 'admin' },
    ]);
  });
});
