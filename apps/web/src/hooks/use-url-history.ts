import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'urlify_history';
const MAX_ITEMS = 10;

export interface UrlHistoryItem {
  shortUrl: string;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
}

type Listener = () => void;

const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach(l => l());
}

function getSnapshot(): UrlHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UrlHistoryItem[]) : [];
  } catch {
    return [];
  }
}

const EMPTY: UrlHistoryItem[] = [];

function getServerSnapshot(): UrlHistoryItem[] {
  return EMPTY;
}

function write(items: UrlHistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emitChange();
}

let cachedSnapshot: UrlHistoryItem[] | undefined;
let cachedRaw: string | undefined;

function getStableSnapshot(): UrlHistoryItem[] {
  const raw = localStorage.getItem(STORAGE_KEY) ?? '';
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = getSnapshot();
  }
  return cachedSnapshot!;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUrlHistory() {
  const items = useSyncExternalStore(
    subscribe,
    getStableSnapshot,
    getServerSnapshot
  );

  const add = useCallback((item: UrlHistoryItem) => {
    const current = getSnapshot();
    const next = [item, ...current].slice(0, MAX_ITEMS);
    write(next);
  }, []);

  const remove = useCallback((shortCode: string) => {
    const current = getSnapshot();
    write(current.filter(i => i.shortCode !== shortCode));
  }, []);

  const clearAll = useCallback(() => {
    write([]);
  }, []);

  return { items, add, remove, clearAll };
}
