export interface PRItem {
  org: string;
  repo: string;
  number: string;
  url: string;
}

/**
 * Parse PR URLs from input (supports comma-separated, line-separated, or both)
 */
export function parsePrUrls(input: string): {
  plainText: string;
  items: PRItem[];
} {
  const items: PRItem[] = [];

  if (!input.trim()) {
    return { plainText: '', items: [] };
  }

  // Split by both newlines and commas, then clean up
  const tokens = input
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  tokens.forEach(token => {
    try {
      const url = new URL(token);
      const pathMatch = url.pathname.match(
        /^\/([^\/]+)\/([^\/]+)\/pull\/(\d+)$/
      );

      if (pathMatch) {
        const [, org, repo, number] = pathMatch;
        items.push({
          org,
          repo,
          number,
          url: token,
        });
      }
    } catch {
      // Invalid URL, skip silently
    }
  });

  const plainText = items.map(item => `${item.repo}#${item.number}`).join(', ');

  return { plainText, items };
}
