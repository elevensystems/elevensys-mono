'use client';

import { createContext, useContext } from 'react';

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

/**
 * Parses the `sidebar-tools` flag from the flags record into an allowlist of
 * tool URL paths. Returns `null` when all tools should be shown.
 */
export function getVisibleToolPaths(flags: FlagsRecord): string[] | null {
  const value = flags['sidebar-tools'];
  if (typeof value !== 'string') return null;
  return parseVisibleToolPaths(value);
}
