import { createClient } from '@vercel/global-config';
import 'server-only';

import { env } from '@/env';
import {
  HISTORY_LIMIT,
  SITE_BANNER_TARGETS,
  targetFlagKey,
} from '@/lib/site-banner-schema';
import type {
  SiteBannerHistoryEntry,
  SiteBannerSnapshot,
  SiteBannerTarget,
} from '@/types/site-banner';

/**
 * Global Config item holding the flag values. Must match the adapter's
 * `globalConfigItemKey`, which defaults to `flags`.
 */
const FLAGS_ITEM_KEY = 'flags';

/** Global Config item holding the announcement change log. */
const HISTORY_ITEM_KEY = 'site-banner-history';

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

/** Announcement values keyed by flag key, ignoring anything non-string. */
function readFlagValues(
  items: Record<string, unknown>
): Record<string, string> {
  const flags = items[FLAGS_ITEM_KEY];
  if (!flags || typeof flags !== 'object' || Array.isArray(flags)) return {};

  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(flags)) {
    if (typeof value === 'string') values[key] = value;
  }
  return values;
}

function readHistory(items: Record<string, unknown>): SiteBannerHistoryEntry[] {
  const history = items[HISTORY_ITEM_KEY];
  if (!Array.isArray(history)) return [];

  return history.filter(
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
    return { values: emptyValues(), history: [], configured: false };
  }

  const items = normalizeItems(await vercelApi<unknown>('/items'));
  const flagValues = readFlagValues(items);

  const values = emptyValues();
  for (const target of SITE_BANNER_TARGETS) {
    values[target] = flagValues[targetFlagKey(target)] ?? '';
  }

  return { values, history: readHistory(items), configured: true };
}

function emptyValues(): Record<SiteBannerTarget, string> {
  return Object.fromEntries(
    SITE_BANNER_TARGETS.map(target => [target, ''])
  ) as Record<SiteBannerTarget, string>;
}

/**
 * Writes one target's announcement and prepends a change-log entry.
 *
 * Global Config items are replaced wholesale, so the `flags` object is read,
 * merged, and written back. Every target key is written on each save — the
 * adapter throws (and the flag falls back to its default, logging a warning)
 * for keys missing from the item, so seeding them all keeps the app logs quiet.
 *
 * There is no locking: two admins saving at once means last-write-wins. With a
 * handful of staff that is acceptable, and the change log makes it visible.
 */
export async function writeSiteBannerValue({
  target,
  value,
  by,
}: {
  target: SiteBannerTarget;
  value: string;
  by: string;
}): Promise<SiteBannerSnapshot> {
  const snapshot = await readSiteBannerSnapshot();

  const flags: Record<string, string> = {};
  for (const key of SITE_BANNER_TARGETS) {
    flags[targetFlagKey(key)] = key === target ? value : snapshot.values[key];
  }

  const entry: SiteBannerHistoryEntry = {
    at: new Date().toISOString(),
    by,
    target,
    action: value ? 'save' : 'clear',
    summary: summarize(value),
  };
  const history = [entry, ...snapshot.history].slice(0, HISTORY_LIMIT);

  await vercelApi('/items', {
    method: 'PATCH',
    body: JSON.stringify({
      items: [
        { operation: 'upsert', key: FLAGS_ITEM_KEY, value: flags },
        { operation: 'upsert', key: HISTORY_ITEM_KEY, value: history },
      ],
    }),
  });

  return {
    values: { ...snapshot.values, [target]: value },
    history,
    configured: true,
  };
}

/** One-line description of a saved announcement, for the change log. */
function summarize(value: string): string {
  if (!value) return 'Banner cleared';

  try {
    const parsed = JSON.parse(value) as { title?: string; message?: string };
    const text = parsed.title || parsed.message || '';
    return text.length > 120
      ? `${text.slice(0, 117)}…`
      : text || 'Banner saved';
  } catch {
    return 'Banner saved';
  }
}
