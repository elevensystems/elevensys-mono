import type { TenantKey } from '@/lib/domain-config';

/**
 * Parses the `visible-tools` flag value into an allowlist of tool URL paths
 * for the given tenant.
 *
 * Flag value must be a JSON object keyed by TenantKey:
 *   { "elevensys": ["/tools/passly"], "fhmhub": [] }
 *
 * - Key absent or flag empty → `null` (show all tools for that tenant)
 * - Key maps to `[]`         → `[]`   (hide all tools)
 * - Key maps to `["/tools/passly", ...]` → show only those tools
 */
export function getVisibleToolPaths(
  visibleTools: string,
  tenant: TenantKey
): string[] | null {
  if (!visibleTools) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(visibleTools);
  } catch {
    console.error(
      '[flags] visible-tools: malformed JSON value "%s" — showing all tools',
      visibleTools
    );
    return null;
  }

  // `""` is the Vercel "All tools" variant — treat as unset.
  if (parsed === '') return null;

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    console.error(
      '[flags] visible-tools: expected a JSON object keyed by tenant, got %s — showing all tools',
      JSON.stringify(parsed)
    );
    return null;
  }

  const tenantValue = (parsed as Record<string, unknown>)[tenant];

  // Key absent → no restriction for this tenant.
  if (tenantValue === undefined) return null;

  if (
    !Array.isArray(tenantValue) ||
    !tenantValue.every(item => typeof item === 'string')
  ) {
    console.error(
      '[flags] visible-tools: value for tenant "%s" must be a string array, got %s — showing all tools',
      tenant,
      JSON.stringify(tenantValue)
    );
    return null;
  }

  return tenantValue;
}
