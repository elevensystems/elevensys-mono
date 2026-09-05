'use client';

import { Banner } from '@workspace/ui/components/banner';
import { useSiteAnnouncements } from '@workspace/ui/components/site-announcement-provider';
import type { SiteAnnouncement } from '@workspace/ui/lib/site-announcement';

interface SiteBannerProps {
  /**
   * The announcements to show, most urgent first. Defaults to the ones
   * resolved by `SiteAnnouncementProvider`; pass explicitly to drive the stack
   * from another source, as the admin editor's live preview does.
   */
  announcements?: SiteAnnouncement[];
  /** Full-bleed styling, for rendering directly under a sticky header. */
  flush?: boolean;
}

/**
 * Site-wide announcement/maintenance banners shared by every app.
 *
 * An app can show several at once — the global ones plus any targeted at it —
 * stacked most urgent first. Values are validated and ordered server-side by
 * `getSiteAnnouncements`, so there is nothing to parse or sort here. Banners
 * cannot be dismissed; they stay visible until cleared or updated.
 */
export function SiteBanner({ announcements, flush = true }: SiteBannerProps) {
  const fromContext = useSiteAnnouncements();
  const resolved = announcements ?? fromContext;

  if (resolved.length === 0) return null;

  return (
    <div className={flush ? '' : 'space-y-2'}>
      {resolved.map((announcement, index) => (
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
        />
      ))}
    </div>
  );
}
