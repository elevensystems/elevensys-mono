import type {
  SiteAnnouncement,
  SiteBannerApp,
} from '@workspace/ui/lib/site-announcement';

/** Which apps an announcement is shown on. `all` is the global fallback. */
export type SiteBannerTarget = 'all' | SiteBannerApp;

/** One recorded change in the shared audit log, newest first. */
export interface SiteBannerHistoryEntry {
  /** ISO 8601 instant the change was saved. */
  at: string;
  /** Display name of the staff member who saved it. */
  by: string;
  /** Config feature the entry belongs to, e.g. `site-banner`. */
  feature: string;
  target: SiteBannerTarget;
  action: 'save' | 'clear';
  /** Short human-readable description, e.g. the first line of the message. */
  summary: string;
}

/**
 * Everything the editor needs to render. A target missing from `values` has no
 * announcements — "off" and "absent" are the same state.
 */
export interface SiteBannerSnapshot {
  values: Partial<Record<SiteBannerTarget, SiteAnnouncement[]>>;
  history: SiteBannerHistoryEntry[];
  /** False when the Global Config store or API token is not configured. */
  configured: boolean;
}
