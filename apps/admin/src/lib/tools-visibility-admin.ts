import {
  SIDEBAR_TOOLS_ITEM_KEY,
  TOOL_PATHS,
  parseVisibleToolPaths,
} from '@workspace/ui/lib/tools';
import 'server-only';

import {
  GlobalConfigError,
  NOT_CONFIGURED_MESSAGE,
  isGlobalConfigConfigured,
  readAudit,
  readItems,
  writeConfigItem,
} from '@/lib/global-config-client';
import type { ConfigAuditEntry } from '@/types/config-audit';
import type { ToolsVisibilitySnapshot } from '@/types/tools-visibility';

/** Tags this feature's entries in the shared change log. */
export const TOOLS_VISIBILITY_FEATURE = SIDEBAR_TOOLS_ITEM_KEY;

/** This feature's slice of the shared change log. */
function history(audit: ConfigAuditEntry[]): ConfigAuditEntry[] {
  return audit.filter(entry => entry.feature === TOOLS_VISIBILITY_FEATURE);
}

/**
 * The current allowlist plus the change log. `visible` is `null` when every
 * tool is shown — the same "absent means everything" rule the apps read.
 */
export async function readToolsVisibilitySnapshot(): Promise<ToolsVisibilitySnapshot> {
  if (!isGlobalConfigConfigured()) {
    return { visible: null, history: [], configured: false };
  }

  const items = await readItems();

  return {
    visible: parseVisibleToolPaths(items[SIDEBAR_TOOLS_ITEM_KEY]),
    history: history(readAudit(items)),
    configured: true,
  };
}

/**
 * Saves the allowlist, or deletes the item when `visible` is `null`.
 *
 * Deleting is not the same as saving every path: an absent item shows tools
 * added later too, while an explicit list would hide them. That is the
 * difference the editor's "show every tool" switch controls.
 *
 * Unknown paths are dropped rather than stored, so retiring a tool cleans
 * itself up on the next save.
 */
export async function writeToolsVisibility({
  visible,
  by,
}: {
  visible: string[] | null;
  by: string;
}): Promise<ToolsVisibilitySnapshot> {
  if (!isGlobalConfigConfigured()) {
    throw new GlobalConfigError(503, NOT_CONFIGURED_MESSAGE);
  }

  const known = visible?.filter(path => TOOL_PATHS.includes(path)) ?? null;
  const items = await readItems();

  const audit = await writeConfigItem({
    key: SIDEBAR_TOOLS_ITEM_KEY,
    value: known ?? undefined,
    items,
    entry: {
      at: new Date().toISOString(),
      by,
      feature: TOOLS_VISIBILITY_FEATURE,
      action: known ? 'save' : 'clear',
      summary: summarize(known),
    },
  });

  return { visible: known, history: history(audit), configured: true };
}

/** One-line description of a save, for the change log. */
function summarize(visible: string[] | null): string {
  if (!visible) return 'Every tool visible';
  if (visible.length === 0) return 'No tools visible';

  return `${visible.length} of ${TOOL_PATHS.length} tools visible`;
}
