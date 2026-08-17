'use client';

import type { FlagsRecord } from '@workspace/ui/components/flags-provider';

import { getVisibleToolPaths as parseVisibleToolPaths } from '@/lib/flags-utils';

// The provider/hook themselves are shared so every app wires flags the same
// way; re-exported here so app-local imports keep pointing at one place.
export {
  FlagsProvider,
  useFlags,
} from '@workspace/ui/components/flags-provider';
export type { FlagsRecord } from '@workspace/ui/components/flags-provider';

/**
 * Parses the `sidebar-tools` flag from the flags record into an allowlist of
 * tool URL paths. Returns `null` when all tools should be shown.
 */
export function getVisibleToolPaths(flags: FlagsRecord): string[] | null {
  const value = flags['sidebar-tools'];
  if (typeof value !== 'string') return null;
  return parseVisibleToolPaths(value);
}
