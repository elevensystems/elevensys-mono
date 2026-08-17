'use client';

import * as React from 'react';

export type FlagsRecord = Record<string, boolean | string>;

const FlagsContext = React.createContext<FlagsRecord>({});

interface FlagsProviderProps {
  children: React.ReactNode;
  flags: FlagsRecord;
}

/**
 * Makes flag values resolved in a server layout available to client components.
 *
 * Each app resolves its own flags (see the app's `src/flags.ts`) and passes the
 * record down; shared components such as `SiteBanner` read from here so the
 * wiring is identical in every app.
 */
export function FlagsProvider({ children, flags }: FlagsProviderProps) {
  return (
    <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>
  );
}

export function useFlags() {
  return React.useContext(FlagsContext);
}
