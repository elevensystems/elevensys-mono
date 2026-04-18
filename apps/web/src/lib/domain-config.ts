export type TenantKey = 'fhmhub' | 'elevensys';

export interface DomainConfig {
  tenant: TenantKey;
  appName: string;
  description: string;
  showTools: boolean;
  blockedRoutes: string[];
}

const TENANT_CONFIGS: Record<TenantKey, DomainConfig> = {
  fhmhub: {
    tenant: 'fhmhub',
    appName: 'Jirassic World',
    description: 'Your Jira Timesheet Companion',
    showTools: false,
    blockedRoutes: ['/tools'],
  },
  elevensys: {
    tenant: 'elevensys',
    appName: 'Eleven Systems',
    description: 'Connecting Ideas, Building Solutions',
    showTools: true,
    blockedRoutes: [],
  },
};

const HOSTNAME_TO_TENANT: Record<string, TenantKey> = {
  'logwork.fhmhub.com': 'fhmhub',
  'elevensystems.dev': 'elevensys',
};

export const DEFAULT_TENANT: TenantKey = 'elevensys';

export function getTenantConfig(tenant: TenantKey): DomainConfig {
  return TENANT_CONFIGS[tenant];
}

export function resolveTenantFromHostname(hostname: string): TenantKey {
  const bare = hostname.split(':')[0];
  return HOSTNAME_TO_TENANT[bare] ?? DEFAULT_TENANT;
}
