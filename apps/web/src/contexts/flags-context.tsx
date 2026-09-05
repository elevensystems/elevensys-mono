'use client';

import * as React from 'react';

import { getVisibleToolPaths as parseVisibleToolPaths } from '@/lib/flags-utils';

export type FlagsRecord = Record<string, boolean | string>;

const FlagsContext = React.createContext<FlagsRecord>({});

interface FlagsProviderProps {
  children: React.ReactNode;
  flags: FlagsRecord;
}

/**
 * Makes flag values resolved in the server layout available to client
 * components.
 *
 * This lives in `apps/web` because it is the only app with feature flags (see
 * `src/flags.ts`). The site announcement banner is not a flag — it has its own
 * `SiteAnnouncementProvider` in `@workspace/ui`.
 */
export function FlagsProvider({ children, flags }: FlagsProviderProps) {
  return (
    <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>
  );
}

export function useFlags() {
  return React.useContext(FlagsContext);
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
