/** Global Config item holding the tool allowlist. */
export const SIDEBAR_TOOLS_ITEM_KEY = 'sidebar-tools';

/**
 * Every tool `apps/web` ships, by URL path and display name.
 *
 * Shared because two apps need the same list: `apps/web` renders it in the
 * sidebar (adding its own icons), and the `apps/admin` editor renders one
 * checkbox per entry. A duplicated list would drift the moment a tool is added.
 */
export const TOOLS = [
  { url: '/tools/json-diffinity', name: 'JSON Diffinity' },
  { url: '/tools/json-objectify', name: 'JSON Objectify' },
  { url: '/tools/json-lens', name: 'JSON Lens' },
  { url: '/tools/caseify', name: 'Caseify' },
  { url: '/tools/urlify', name: 'Urlify' },
  { url: '/tools/translately', name: 'Translately' },
  { url: '/tools/npm-converter', name: 'NPM Converter' },
  { url: '/tools/passly', name: 'Passly' },
  { url: '/tools/beatly', name: 'Beatly' },
] as const;

export type ToolPath = (typeof TOOLS)[number]['url'];

export const TOOL_PATHS: readonly string[] = TOOLS.map(tool => tool.url);

/**
 * Stored value → the allowlist of visible tool paths.
 *
 * - absent (`null`/`undefined`) → `null`, meaning show every tool, including
 *   ones added after the value was saved
 * - `[]` → no tools
 * - `["/tools/passly", …]` → only those
 *
 * Anything else is a malformed value: it logs and falls open to `null`. Hiding
 * every tool because a stored value went bad would be the worse failure.
 */
export function parseVisibleToolPaths(value: unknown): string[] | null {
  if (value === null || value === undefined) return null;

  if (!Array.isArray(value) || !value.every(it => typeof it === 'string')) {
    console.error(
      '[sidebar-tools] expected an array of tool paths, got %s — showing all tools',
      JSON.stringify(value)
    );
    return null;
  }

  return value;
}
