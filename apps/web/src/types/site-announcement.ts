export type SiteAnnouncementState = 'info' | 'success' | 'warning' | 'error';

export interface SiteAnnouncement {
  state: SiteAnnouncementState;
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}
