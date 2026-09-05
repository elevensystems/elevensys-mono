'use client';

import { Banner } from '@workspace/ui/components/banner';
import { useSiteAnnouncements } from '@workspace/ui/components/site-announcement-provider';
import {
  dismissBanner,
  useDismissedBanners,
} from '@workspace/ui/lib/banner-dismissal';
import {
  type SiteAnnouncement,
  announcementKey,
} from '@workspace/ui/lib/site-announcement';

interface SiteBannerProps {
  /**
   * The announcements to show, most urgent first. Defaults to the ones
   * resolved by `SiteAnnouncementProvider`; pass explicitly to drive the stack
   * from another source, as the admin editor's live preview does.
   */
  announcements?: SiteAnnouncement[];
  /** Full-bleed styling, for rendering directly under a sticky header. */
  flush?: boolean;
  /**
   * Renders the stack without wiring dismissal to storage: the close button
   * shows so staff can see it, but clicking it neither hides the preview nor
   * records anything against the real banner.
   */
  preview?: boolean;
}

/**
 * Site-wide announcement/maintenance banners shared by every app.
 *
 * An app can show several at once — the global ones plus any targeted at it —
 * stacked most urgent first. Values are validated and ordered server-side by
 * `getSiteAnnouncements`, so there is nothing to parse or sort here.
 *
 * A banner stays up until it is cleared or updated unless it was published as
 * `dismissible`, in which case the reader can close it and this browser
 * remembers that until staff edit the banner (see `announcementKey`).
 */
export function SiteBanner({
  announcements,
  flush = true,
  preview = false,
}: SiteBannerProps) {
  const fromContext = useSiteAnnouncements();
  const dismissed = useDismissedBanners();
  const resolved = announcements ?? fromContext;

  // Every key on screen, so a dismissal can prune the ones that are not.
  const keys = resolved.map(announcementKey);
  const visible = resolved.filter(
    announcement =>
      preview ||
      !announcement.dismissible ||
      !dismissed.includes(announcementKey(announcement))
  );

  if (visible.length === 0) return null;

  return (
    <div className={flush ? '' : 'space-y-2'}>
      {visible.map((announcement, index) => (
        <Banner
          key={announcement.id ?? index}
          flush={flush}
          state={announcement.state}
          title={announcement.title}
          message={announcement.message}
          action={
            announcement.actionLabel && announcement.actionHref
              ? {
                  label: announcement.actionLabel,
                  href: announcement.actionHref,
                }
              : undefined
          }
          onDismiss={
            announcement.dismissible
              ? () => {
                  // The preview shows the close button without acting on it.
                  if (!preview)
                    dismissBanner(announcementKey(announcement), keys);
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
