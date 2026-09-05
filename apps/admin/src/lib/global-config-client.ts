import { createClient } from '@vercel/global-config';
import 'server-only';

import { env } from '@/env';
import { type ConfigAuditEntry, HISTORY_LIMIT } from '@/types/config-audit';

/**
 * Global Config item holding the change log for every config feature, newest
 * first. Entries are tagged with `feature` so every feature can share it.
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
      '[global-config] GLOBAL_CONFIG is not a valid connection string'
    );
    return null;
  }
}

/**
 * True when the editors can read and write. Reads need the store, writes also
 * need an API token — both are checked so the UI can fail with one message.
 */
export function isGlobalConfigConfigured(): boolean {
  return Boolean(getStoreId() && env.VERCEL_API_TOKEN);
}

/** The one message every editor shows when the store is not wired up. */
export const NOT_CONFIGURED_MESSAGE =
  'Global Config storage is not configured. Set GLOBAL_CONFIG and VERCEL_API_TOKEN.';

export async function vercelApi<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const storeId = getStoreId();
  if (!storeId || !env.VERCEL_API_TOKEN) {
    throw new GlobalConfigError(503, NOT_CONFIGURED_MESSAGE);
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
export function normalizeItems(payload: unknown): Record<string, unknown> {
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

/** Reads every item, the shape both editors start from. */
export async function readItems(): Promise<Record<string, unknown>> {
  return normalizeItems(await vercelApi<unknown>('/items'));
}

/** The whole change log, including entries belonging to other features. */
export function readAudit(items: Record<string, unknown>): ConfigAuditEntry[] {
  const audit = items[AUDIT_ITEM_KEY];
  if (!Array.isArray(audit)) return [];

  return audit.filter(
    (entry): entry is ConfigAuditEntry =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof (entry as ConfigAuditEntry).at === 'string' &&
      typeof (entry as ConfigAuditEntry).summary === 'string'
  );
}

/**
 * Writes one feature's item and its new audit entry in a single PATCH.
 *
 * Passing `undefined` as the value deletes the item. Only the named item and
 * the shared audit log are touched, so one feature's save can never disturb
 * another's config.
 *
 * There is no locking: two admins saving at once means last-write-wins. With a
 * handful of staff that is acceptable, and the change log makes it visible.
 */
export async function writeConfigItem({
  key,
  value,
  entry,
  items,
}: {
  key: string;
  value: unknown;
  entry: ConfigAuditEntry;
  items: Record<string, unknown>;
}): Promise<ConfigAuditEntry[]> {
  const audit = [entry, ...readAudit(items)].slice(0, HISTORY_LIMIT);

  await vercelApi('/items', {
    method: 'PATCH',
    body: JSON.stringify({
      items: [
        value === undefined
          ? { operation: 'delete', key }
          : { operation: 'upsert', key, value },
        { operation: 'upsert', key: AUDIT_ITEM_KEY, value: audit },
      ],
    }),
  });

  return audit;
}
