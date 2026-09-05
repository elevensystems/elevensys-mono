import {
  SITE_BANNER_ITEM_KEY,
  type SiteAnnouncement,
  type SiteBannerConfig,
  announcementSchema,
  sortAnnouncements,
} from '@workspace/ui/lib/site-announcement';
import 'server-only';

import {
  GlobalConfigError,
  NOT_CONFIGURED_MESSAGE,
  isGlobalConfigConfigured,
  readAudit,
  readItems,
  writeConfigItem,
} from '@/lib/global-config-client';
import {
  SITE_BANNER_FEATURE,
  SITE_BANNER_TARGETS,
} from '@/lib/site-banner-schema';
import type { ConfigAuditEntry } from '@/types/config-audit';
import type { SiteBannerSnapshot, SiteBannerTarget } from '@/types/site-banner';

/**
 * The stored announcements for each target, in stacking order. Every entry is
 * validated on its own so one malformed announcement does not blank the editor
 * for the rest.
 *
 * Unlike the apps' read, this keeps scheduled announcements that are not
 * showing yet — staff need to see and edit them before they go live.
 */
function readBannerConfig(items: Record<string, unknown>): SiteBannerConfig {
  const stored = items[SITE_BANNER_ITEM_KEY];
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};

  const config: SiteBannerConfig = {};
  for (const target of SITE_BANNER_TARGETS) {
    const value = (stored as Record<string, unknown>)[target];
    if (!Array.isArray(value)) continue;

    const announcements: SiteAnnouncement[] = [];
    for (const entry of value) {
      const result = announcementSchema.safeParse(entry);
      if (result.success) announcements.push(result.data);
      else console.error('[site-banner] ignoring invalid "%s" entry', target);
    }

    if (announcements.length > 0)
      config[target] = sortAnnouncements(announcements);
  }
  return config;
}

/** This feature's slice of the shared change log. */
function bannerHistory(audit: ConfigAuditEntry[]): ConfigAuditEntry[] {
  return audit.filter(entry => entry.feature === SITE_BANNER_FEATURE);
}

/**
 * Current announcements for every target plus the change log, read straight
 * from the Vercel API rather than the Global Config SDK. The API is consistent
 * with writes, so the editor shows what was just saved instead of waiting out
 * replication.
 */
export async function readSiteBannerSnapshot(): Promise<SiteBannerSnapshot> {
  if (!isGlobalConfigConfigured()) {
    return { values: {}, history: [], configured: false };
  }

  const items = await readItems();

  return {
    values: readBannerConfig(items),
    history: bannerHistory(readAudit(items)),
    configured: true,
  };
}

/**
 * Adds, replaces, or removes one announcement in a target's list, and prepends
 * an audit entry.
 *
 * The announcement is addressed by `id`: an id already in the list is replaced
 * in place, a new one is appended, and a `null` announcement removes it. This
 * is what lets several banners coexist on one target without a save wiping the
 * others. A target left with no announcements is dropped rather than stored as
 * an empty list, keeping "off" and "absent" the same state.
 */
export async function writeSiteBannerValue({
  target,
  id,
  announcement,
  by,
}: {
  target: SiteBannerTarget;
  id: string;
  announcement: SiteAnnouncement | null;
  by: string;
}): Promise<SiteBannerSnapshot> {
  if (!isGlobalConfigConfigured()) {
    throw new GlobalConfigError(503, NOT_CONFIGURED_MESSAGE);
  }

  const items = await readItems();
  const config = readBannerConfig(items);

  const rest = (config[target] ?? []).filter(entry => entry.id !== id);

  if (announcement) {
    // `id` and `savedAt` are stamped here, never taken from the client: the id
    // keys the list and the timestamp decides stacking order among equals.
    const saved = { ...announcement, id, savedAt: new Date().toISOString() };
    config[target] = sortAnnouncements([...rest, saved]);
  } else if (rest.length > 0) {
    config[target] = rest;
  } else {
    delete config[target];
  }

  const audit = await writeConfigItem({
    key: SITE_BANNER_ITEM_KEY,
    value: config,
    items,
    entry: {
      at: new Date().toISOString(),
      by,
      feature: SITE_BANNER_FEATURE,
      target,
      action: announcement ? 'save' : 'clear',
      summary: summarize(announcement),
    },
  });

  return { values: config, history: bannerHistory(audit), configured: true };
}

/** One-line description of a saved announcement, for the change log. */
function summarize(announcement: SiteAnnouncement | null): string {
  if (!announcement) return 'Banner cleared';

  const text = announcement.title || announcement.message;
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}
