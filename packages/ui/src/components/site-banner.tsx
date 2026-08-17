'use client';

import { useSyncExternalStore } from 'react';

import { Banner } from '@workspace/ui/components/banner';
import { useFlags } from '@workspace/ui/components/flags-provider';
import {
  SITE_BANNER_FLAG_KEY,
  parseAnnouncementBanner,
} from '@workspace/ui/lib/site-announcement';

const DISMISSED_STORAGE_KEY = 'site-banner-dismissed';
const dismissListeners = new Set<() => void>();

function subscribe(callback: () => void) {
  dismissListeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    dismissListeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(DISMISSED_STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

function dismissAnnouncement(dismissKey: string) {
  localStorage.setItem(DISMISSED_STORAGE_KEY, dismissKey);
  dismissListeners.forEach(listener => listener());
}

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
 * Content comes from the `site-banner` flag; dismissal is keyed by the
 * announcement's own content, so editing the flag surfaces the banner again
 * for users who dismissed a previous message.
 */
export function SiteBanner({ value, flush = true }: SiteBannerProps) {
  const flags = useFlags();
  const rawValue = value ?? flags[SITE_BANNER_FLAG_KEY];
  const announcement =
    typeof rawValue === 'string' ? parseAnnouncementBanner(rawValue) : null;
  const dismissKey = announcement ? JSON.stringify(announcement) : null;

  const dismissedKey = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (!announcement || !dismissKey || dismissedKey === dismissKey) return null;

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
      onDismiss={() => dismissAnnouncement(dismissKey)}
    />
  );
}
