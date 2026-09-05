import { createClient } from '@vercel/global-config';
import {
  SITE_BANNER_ITEM_KEY,
  type SiteAnnouncement,
  type SiteBannerConfig,
  announcementSchema,
  sortAnnouncements,
} from '@workspace/ui/lib/site-announcement';
import 'server-only';

import { env } from '@/env';
import {
  HISTORY_LIMIT,
  SITE_BANNER_FEATURE,
  SITE_BANNER_TARGETS,
} from '@/lib/site-banner-schema';
import type {
  SiteBannerHistoryEntry,
  SiteBannerSnapshot,
  SiteBannerTarget,
} from '@/types/site-banner';

/**
 * Global Config item holding the change log for every config feature, newest
 * first. Entries are tagged with `feature` so a second feature can share it.
 *
 * Named `config-audit`, not `audit`: this app already has an unrelated audit
 * feature backed by the API (`/api/audit`).
 */
const AUDIT_ITEM_KEY = 'config-audit';

const VERCEL_API = 'https://api.vercel.com';

export class GlobalConfigError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'GlobalConfigError';
  }
}

const connectionString = env.GLOBAL_CONFIG ?? env.EDGE_CONFIG;

/**
 * Store id parsed out of the connection string, or `null` when unset or
 * malformed. `createClient` throws on a string it cannot parse.
 */
function getStoreId(): string | null {
  if (!connectionString) return null;

  try {
    return createClient(connectionString).connection.id;
  } catch {
    console.error(
      '[site-banner] GLOBAL_CONFIG is not a valid connection string'
    );
    return null;
  }
}

/**
 * True when the editor can read and write. Reads need the store, writes also
 * need an API token — both are checked so the UI can fail with one message.
 */
export function isSiteBannerStoreConfigured(): boolean {
  return Boolean(getStoreId() && env.VERCEL_API_TOKEN);
}

async function vercelApi<T>(path: string, init?: RequestInit): Promise<T> {
  const storeId = getStoreId();
  if (!storeId || !env.VERCEL_API_TOKEN) {
    throw new GlobalConfigError(
      503,
      'Site banner storage is not configured. Set GLOBAL_CONFIG and VERCEL_API_TOKEN.'
    );
  }

  const url = new URL(`${VERCEL_API}/v1/global-config/${storeId}${path}`);
  if (env.VERCEL_TEAM_ID) url.searchParams.set('teamId', env.VERCEL_TEAM_ID);

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new GlobalConfigError(
      response.status,
      errorMessage(data) ??
        `Global Config request failed with status ${response.status}`
    );
  }

  return data as T;
}

/** Digs the human-readable reason out of Vercel's `{ error: { message } }`. */
function errorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('error' in data)) return null;

  const { error } = data as { error: unknown };
  if (!error || typeof error !== 'object' || !('message' in error)) return null;

  const { message } = error as { message: unknown };
  return typeof message === 'string' && message ? message : null;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * `GET /items` returns an array of `{ key, value }` records on api.vercel.com,
 * while the edge endpoint returns a plain map. Normalize both to a map so the
 * caller does not care which it got.
 */
function normalizeItems(payload: unknown): Record<string, unknown> {
  if (Array.isArray(payload)) {
    const items: Record<string, unknown> = {};
    for (const entry of payload) {
      if (entry && typeof entry === 'object' && 'key' in entry) {
        const { key, value } = entry as { key: unknown; value: unknown };
        if (typeof key === 'string') items[key] = value;
      }
    }
    return items;
  }

  if (payload && typeof payload === 'object') {
    return payload as Record<string, unknown>;
  }

  return {};
}

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

/** The whole audit log, including entries belonging to other features. */
function readAudit(items: Record<string, unknown>): SiteBannerHistoryEntry[] {
  const audit = items[AUDIT_ITEM_KEY];
  if (!Array.isArray(audit)) return [];

  return audit.filter(
    (entry): entry is SiteBannerHistoryEntry =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof (entry as SiteBannerHistoryEntry).at === 'string' &&
      typeof (entry as SiteBannerHistoryEntry).summary === 'string'
  );
}

/**
 * Current announcement for every target plus the change log, read straight from
 * the Vercel API rather than the Global Config SDK. The API is consistent with
 * writes, so the editor shows what was just saved instead of waiting out
 * replication.
 */
export async function readSiteBannerSnapshot(): Promise<SiteBannerSnapshot> {
  if (!isSiteBannerStoreConfigured()) {
    return { values: {}, history: [], configured: false };
  }

  const items = normalizeItems(await vercelApi<unknown>('/items'));

  return {
    values: readBannerConfig(items),
    history: readAudit(items).filter(
      entry => entry.feature === SITE_BANNER_FEATURE
    ),
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
 * others.
 *
 * Global Config items are replaced wholesale, so the `site-banner` item is
 * read, merged, and written back — but only this feature's item is touched, so
 * a save can never disturb another feature's config or `apps/web`'s real
 * `flags` item. A target left with no announcements is deleted rather than
 * stored as an empty list, keeping "off" and "absent" the same state.
 *
 * There is no locking: two admins saving at once means last-write-wins. With a
 * handful of staff that is acceptable, and the audit log makes it visible.
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
  if (!isSiteBannerStoreConfigured()) {
    throw new GlobalConfigError(
      503,
      'Site banner storage is not configured. Set GLOBAL_CONFIG and VERCEL_API_TOKEN.'
    );
  }

  const items = normalizeItems(await vercelApi<unknown>('/items'));
  const config = readBannerConfig(items);

  const existing = config[target] ?? [];
  const rest = existing.filter(entry => entry.id !== id);

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

  const entry: SiteBannerHistoryEntry = {
    at: new Date().toISOString(),
    by,
    feature: SITE_BANNER_FEATURE,
    target,
    action: announcement ? 'save' : 'clear',
    summary: summarize(announcement),
  };
  const audit = [entry, ...readAudit(items)].slice(0, HISTORY_LIMIT);

  await vercelApi('/items', {
    method: 'PATCH',
    body: JSON.stringify({
      items: [
        { operation: 'upsert', key: SITE_BANNER_ITEM_KEY, value: config },
        { operation: 'upsert', key: AUDIT_ITEM_KEY, value: audit },
      ],
    }),
  });

  return {
    values: config,
    history: audit.filter(item => item.feature === SITE_BANNER_FEATURE),
    configured: true,
  };
}

/** One-line description of a saved announcement, for the audit log. */
function summarize(announcement: SiteAnnouncement | null): string {
  if (!announcement) return 'Banner cleared';

  const text = announcement.title || announcement.message;
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}
