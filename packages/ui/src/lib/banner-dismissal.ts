'use client';

import * as React from 'react';

/**
 * Which banners this browser has closed. Local to one browser on purpose — a
 * dismissal is a reading preference, not something worth a round trip or a
 * per-reader record in Global Config.
 */
const STORAGE_KEY = 'site-banner-dismissed';

/** Nothing is dismissed on the server, and nothing may be during hydration. */
const NONE: readonly string[] = Object.freeze([]);

/**
 * Cached parse of the stored list, keyed by the raw string it came from, so
 * `getSnapshot` hands back the same array between writes —
 * `useSyncExternalStore` re-renders forever otherwise.
 */
let cached: readonly string[] = NONE;
let cachedRaw: string | null | undefined;

/**
 * Set when a write was refused (blocked storage, quota). The in-memory list is
 * authoritative from then on, so closing a banner still works for this page
 * load even though nothing was persisted.
 */
let memoryOnly = false;

const listeners = new Set<() => void>();

function getSnapshot(): readonly string[] {
  if (memoryOnly) return cached;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage is unavailable (private mode, blocked cookies).
    return cached;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cached = Array.isArray(parsed)
        ? parsed.filter((key): key is string => typeof key === 'string')
        : NONE;
    } catch {
      // Something we did not write. Treat it as nothing dismissed.
      cached = NONE;
    }
  }

  return cached;
}

const getServerSnapshot = () => NONE;

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Closing a banner in one tab closes it in the others too.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * The keys this browser has dismissed. Empty on the server and through
 * hydration, so the markup React hydrates always matches what was rendered; a
 * dismissed banner disappears on the commit after.
 */
export function useDismissedBanners(): readonly string[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Records `key` as dismissed.
 *
 * `keep` is the set of keys still worth remembering — the banners currently on
 * screen. Anything else has been cleared or rewritten since, so it is pruned
 * here rather than accumulating in storage forever.
 */
export function dismissBanner(key: string, keep: Iterable<string>) {
  const live = new Set(keep);
  const next = [...getSnapshot().filter(stored => live.has(stored)), key];
  const raw = JSON.stringify(next);

  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
  } catch {
    // Nothing was persisted: the banner still closes for this page load, it
    // just comes back on the next one.
    memoryOnly = true;
  }

  notify();
}
