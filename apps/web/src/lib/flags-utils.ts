/**
 * Parses the `sidebar-tools` flag value into an allowlist of tool URL paths.
 *
 * Flag value must be a JSON array of tool URL paths:
 *   ["/tools/passly", "/tools/urlify"]
 *
 * - Flag empty → `null` (show all tools)
 * - `[]`       → `[]`   (hide all tools)
 * - `["/tools/passly", ...]` → show only those tools
 */
export function getVisibleToolPaths(visibleTools: string): string[] | null {
  if (!visibleTools) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(visibleTools);
  } catch {
    console.error(
      '[flags] sidebar-tools: malformed JSON value "%s" — showing all tools',
      visibleTools
    );
    return null;
  }

  // `""` is the Vercel "All tools" variant — treat as unset.
  if (parsed === '') return null;

  if (
    !Array.isArray(parsed) ||
    !parsed.every(item => typeof item === 'string')
  ) {
    console.error(
      '[flags] sidebar-tools: expected a JSON array of tool paths, got %s — showing all tools',
      JSON.stringify(parsed)
    );
    return null;
  }

  return parsed;
}
