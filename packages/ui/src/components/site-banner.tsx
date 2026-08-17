'use client';

import { Banner } from '@workspace/ui/components/banner';
import { useFlags } from '@workspace/ui/components/flags-provider';
import {
  SITE_BANNER_FLAG_KEY,
  parseAnnouncementBanner,
} from '@workspace/ui/lib/site-announcement';

interface SiteBannerProps {
  /**
   * Raw announcement JSON. Defaults to the `site-banner` flag exposed by
   * `FlagsProvider`; pass explicitly to drive the banner from another source.
   */
  value?: string;
  /** Full-bleed styling, for rendering directly under a sticky header. */
  flush?: boolean;
}

/**
 * Site-wide announcement/maintenance banner shared by every app.
 *
 * Content comes from the `site-banner` flag. The banner cannot be dismissed —
 * it stays visible until the flag is cleared or updated.
 */
export function SiteBanner({ value, flush = true }: SiteBannerProps) {
  const flags = useFlags();
  const rawValue = value ?? flags[SITE_BANNER_FLAG_KEY];
  const announcement =
    typeof rawValue === 'string' ? parseAnnouncementBanner(rawValue) : null;

  if (!announcement) return null;

  return (
    <Banner
      flush={flush}
      state={announcement.state}
      title={announcement.title}
      message={announcement.message}
      action={
        announcement.actionLabel && announcement.actionHref
          ? { label: announcement.actionLabel, href: announcement.actionHref }
          : undefined
      }
    />
  );
}
