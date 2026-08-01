'use client';

import { useSyncExternalStore } from 'react';

import { Banner } from '@workspace/ui/components/banner';

import { useFlags } from '@/contexts/flags-context';
import { parseAnnouncementBanner } from '@/lib/flags-utils';

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

/**
 * Site-wide announcement/maintenance banner rendered flush under the sticky
 * header. Content comes from the `site-banner` flag; dismissal is keyed by
 * the announcement's own content, so editing the flag surfaces the banner
 * again for users who dismissed a previous message.
 */
export function SiteBanner() {
  const flags = useFlags();
  const rawValue = flags['site-banner'];
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
      flush
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
