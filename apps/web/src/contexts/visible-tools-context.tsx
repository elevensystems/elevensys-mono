'use client';

import * as React from 'react';

/** `null` means every tool is visible. */
const VisibleToolsContext = React.createContext<string[] | null>(null);

interface VisibleToolsProviderProps {
  children: React.ReactNode;
  value: string[] | null;
}

/**
 * Makes the tool allowlist resolved in the server layout available to
 * `AppSidebar`, a client component well below the root layout that does the
 * Global Config read.
 */
export function VisibleToolsProvider({
  children,
  value,
}: VisibleToolsProviderProps) {
  return (
    <VisibleToolsContext.Provider value={value}>
      {children}
    </VisibleToolsContext.Provider>
  );
}

export function useVisibleTools() {
  return React.useContext(VisibleToolsContext);
}
