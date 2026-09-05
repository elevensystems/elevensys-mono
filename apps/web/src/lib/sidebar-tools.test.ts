import { TOOLS, parseVisibleToolPaths } from '@workspace/ui/lib/tools';

const silenceErrors = () =>
  jest.spyOn(console, 'error').mockImplementation(() => {});

describe('parseVisibleToolPaths', () => {
  // --- Show everything ---
  it('returns null when nothing is stored, meaning show every tool', () => {
    expect(parseVisibleToolPaths(undefined)).toBeNull();
    expect(parseVisibleToolPaths(null)).toBeNull();
  });

  // --- An explicit list ---
  it('passes an allowlist through unchanged', () => {
    expect(parseVisibleToolPaths(['/tools/passly', '/tools/urlify'])).toEqual([
      '/tools/passly',
      '/tools/urlify',
    ]);
  });

  it('distinguishes an empty list from an absent one', () => {
    // `[]` hides every tool; absent shows every tool. Both are legitimate.
    expect(parseVisibleToolPaths([])).toEqual([]);
  });

  it('keeps a path that is no longer a known tool', () => {
    // Harmless: it matches nothing, and the editor drops it on the next save.
    expect(parseVisibleToolPaths(['/tools/retired'])).toEqual([
      '/tools/retired',
    ]);
  });

  // --- Fail open ---
  it('falls open to every tool for a malformed value, and logs', () => {
    const spy = silenceErrors();

    expect(parseVisibleToolPaths('/tools/passly')).toBeNull();
    expect(parseVisibleToolPaths({ tools: [] })).toBeNull();
    expect(parseVisibleToolPaths(['/tools/passly', 42])).toBeNull();
    expect(spy).toHaveBeenCalledTimes(3);

    spy.mockRestore();
  });
});

describe('TOOLS', () => {
  it('lists every tool exactly once', () => {
    const urls = TOOLS.map(tool => tool.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('uses /tools/ paths, which the tools layout gates on', () => {
    expect(TOOLS.every(tool => tool.url.startsWith('/tools/'))).toBe(true);
  });
});
