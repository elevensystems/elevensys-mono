'use client';

import { createContext, useContext } from 'react';

import type { TenantKey } from '@/lib/domain-config';
import { getVisibleToolPaths as parseVisibleToolPaths } from '@/lib/flags-utils';

type FlagsRecord = Record<string, boolean | string>;

const FlagsContext = createContext<FlagsRecord>({});

export function FlagsProvider({
  children,
  flags,
}: {
  children: React.ReactNode;
  flags: FlagsRecord;
}) {
  return (
    <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>
  );
}

export function useFlags() {
  return useContext(FlagsContext);
}

/** Returns true if the flag is enabled or no flagKey is required. */
export function isFlagEnabled(flags: FlagsRecord, flagKey?: string): boolean {
  if (!flagKey) return true;
  return flags[flagKey] === true;
}

/**
 * Parses the `visible-tools` flag from the flags record into an allowlist of
 * tool URL paths for the given tenant. Returns `null` when all tools should be shown.
 */
export function getVisibleToolPaths(
  flags: FlagsRecord,
  tenant: TenantKey
): string[] | null {
  const value = flags['visible-tools'];
  if (typeof value !== 'string') return null;
  return parseVisibleToolPaths(value, tenant);
}
