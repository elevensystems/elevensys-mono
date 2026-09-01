import type { SiteBannerApp } from '@workspace/ui/lib/site-announcement';

/** Which apps an announcement is shown on. `all` is the global fallback. */
export type SiteBannerTarget = 'all' | SiteBannerApp;

/** One recorded change to an announcement, newest first in the log. */
export interface SiteBannerHistoryEntry {
  /** ISO 8601 instant the change was saved. */
  at: string;
  /** Display name of the staff member who saved it. */
  by: string;
  target: SiteBannerTarget;
  action: 'save' | 'clear';
  /** Short human-readable description, e.g. the first line of the message. */
  summary: string;
}

/** Everything the editor needs to render: current values plus the change log. */
export interface SiteBannerSnapshot {
  values: Record<SiteBannerTarget, string>;
  history: SiteBannerHistoryEntry[];
  /** False when the Global Config store or API token is not configured. */
  configured: boolean;
}
