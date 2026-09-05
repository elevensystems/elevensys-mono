import { get } from '@vercel/global-config';
import {
  SIDEBAR_TOOLS_ITEM_KEY,
  parseVisibleToolPaths,
} from '@workspace/ui/lib/tools';

/**
 * The tools this app should show, or `null` for "show every tool".
 *
 * Every fallback path returns `null`: a missing store, an unreachable Global
 * Config, or a malformed value all leave the full toolset visible. Failing
 * closed here would hide the whole app over a config read.
 */
export async function getVisibleToolPaths(): Promise<string[] | null> {
  if (!process.env.GLOBAL_CONFIG && !process.env.EDGE_CONFIG) return null;

  try {
    return parseVisibleToolPaths(await get(SIDEBAR_TOOLS_ITEM_KEY));
  } catch (error) {
    // Next signals control flow — a prerender bailing out to dynamic rendering
    // above all, since this read is uncached — by throwing an error carrying a
    // `digest`. Let those through; only a real read failure falls back.
    if (typeof (error as { digest?: unknown })?.digest === 'string')
      throw error;

    console.error('[sidebar-tools] could not read Global Config:', error);
    return null;
  }
}
