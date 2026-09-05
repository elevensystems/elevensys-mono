import type {
  SiteAnnouncement,
  SiteBannerApp,
} from '@workspace/ui/lib/site-announcement';

import type { ConfigAuditEntry } from '@/types/config-audit';

/** Which apps an announcement is shown on. `all` is the global fallback. */
export type SiteBannerTarget = 'all' | SiteBannerApp;

/**
 * Everything the editor needs to render. A target missing from `values` has no
 * announcements — "off" and "absent" are the same state.
 */
export interface SiteBannerSnapshot {
  values: Partial<Record<SiteBannerTarget, SiteAnnouncement[]>>;
  history: ConfigAuditEntry[];
  /** False when the Global Config store or API token is not configured. */
  configured: boolean;
}
