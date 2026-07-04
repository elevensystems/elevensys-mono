'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import type { SessionSummary, SessionsResponse } from '@/types/claude-watch';

const DEFAULT_RANGE_DAYS = 30;

const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Read the shared `from`/`to` range from the URL (defaults to last 30 days). */
export function useRangeParams() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const today = new Date();
  const defaultTo = toIsoDate(today);
  const defaultFrom = toIsoDate(
    new Date(today.getTime() - (DEFAULT_RANGE_DAYS - 1) * 86_400_000)
  );

  const from = searchParams.get('from') || defaultFrom;
  const to = searchParams.get('to') || defaultTo;

  const setRange = useCallback(
    (nextFrom: string, nextTo: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set('from', nextFrom);
      next.set('to', nextTo);
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return { from, to, setRange };
}

/** Build a `/api/claude-watch/...` URL with a query object. */
export function usagePath(
  path: string,
  query?: Record<string, string | number | undefined>
): string {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return `/api/claude-watch/${path}${qs ? `?${qs}` : ''}`;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Fetch a claude-watch resource from the local proxy. Refetches when `url` changes. */
export function useClaudeWatch<T>(url: string | null): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: !!url,
    error: null,
  });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      setState(prev => ({ ...prev, loading: true, error: null }));

      fetch(url, { cache: 'no-store' })
        .then(async res => {
          const body = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(
              (body && typeof body === 'object' && 'error' in body
                ? String((body as { error: unknown }).error)
                : null) || `Request failed (${res.status})`
            );
          }
          return body as T;
        })
        .then(data => {
          if (!cancelled) setState({ data, loading: false, error: null });
        })
        .catch(err => {
          if (!cancelled)
            setState({ data: null, loading: false, error: err.message });
        });
    };

    // Deferred so the effect body never calls setState synchronously.
    queueMicrotask(run);

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}

interface SessionsState {
  sessions: SessionSummary[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  nextCursor: string | null;
  loadMore: () => void;
}

/** Sessions list with cursor-based "Load more" pagination. */
export function useSessions(
  baseQuery: Record<string, string | number | undefined>
): SessionsState {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);

  const queryKey = JSON.stringify(baseQuery);

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const url = usagePath('sessions', {
          ...baseQuery,
          cursor: cursor ?? undefined,
        });
        const res = await fetch(url, { cache: 'no-store' });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            (body && typeof body === 'object' && 'error' in body
              ? String((body as { error: unknown }).error)
              : null) || `Request failed (${res.status})`
          );
        }
        const data = body as SessionsResponse;
        setSessions(prev =>
          append ? [...prev, ...data.sessions] : data.sessions
        );
        setNextCursor(data.nextCursor);
        cursorRef.current = data.nextCursor;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryKey]
  );

  useEffect(() => {
    // Deferred so the effect body never calls setState synchronously.
    queueMicrotask(() => fetchPage(null, false));
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (cursorRef.current) fetchPage(cursorRef.current, true);
  }, [fetchPage]);

  return { sessions, loading, loadingMore, error, nextCursor, loadMore };
}
