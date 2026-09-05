'use client';

import * as React from 'react';

import type { SiteAnnouncement } from '@workspace/ui/lib/site-announcement';

const SiteAnnouncementContext = React.createContext<SiteAnnouncement[]>([]);

interface SiteAnnouncementProviderProps {
  children: React.ReactNode;
  announcements: SiteAnnouncement[];
}

/**
 * Makes the announcements resolved in a server layout available to the client
 * `SiteBanner`, which every app renders from its own `MainLayout`.
 *
 * A context rather than a prop because `MainLayout` is rendered per page, deep
 * below the root layout that does the Global Config read.
 */
export function SiteAnnouncementProvider({
  children,
  announcements,
}: SiteAnnouncementProviderProps) {
  return (
    <SiteAnnouncementContext.Provider value={announcements}>
      {children}
    </SiteAnnouncementContext.Provider>
  );
}

export function useSiteAnnouncements() {
  return React.useContext(SiteAnnouncementContext);
}
