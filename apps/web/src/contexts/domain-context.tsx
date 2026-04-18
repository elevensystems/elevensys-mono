'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { DomainConfig } from '@/lib/domain-config';

const DomainContext = createContext<DomainConfig | null>(null);

interface DomainProviderProps {
  config: DomainConfig;
  children: ReactNode;
}

export function DomainProvider({ config, children }: DomainProviderProps) {
  return (
    <DomainContext.Provider value={config}>{children}</DomainContext.Provider>
  );
}

export function useDomain(): DomainConfig {
  const config = useContext(DomainContext);
  if (!config) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return config;
}
