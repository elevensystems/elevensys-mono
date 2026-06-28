'use client';

import { useEffect, useRef, useState } from 'react';

export type AuditStatsType = 'volume' | 'latency' | 'status' | 'events';

export interface AuditStatsBucket {
  bucket: string; // ISO 8601 UTC
  INFO: number;
  WARN: number;
  ERROR: number;
}

export interface AuditStatsResponse {
  interval: string; // '1h' | '6h' | '1d'
  buckets: AuditStatsBucket[];
}

export interface AuditLatencyBucket {
  bucket: string; // ISO 8601 UTC
  avg: number; // ms
  p95: number; // ms
  count: number; // samples in the bucket
}

export interface AuditLatencyResponse {
  interval: string;
  buckets: AuditLatencyBucket[];
}

export interface AuditStatusBucket {
  bucket: string; // ISO 8601 UTC
  s2xx: number;
  s3xx: number;
  s4xx: number;
  s5xx: number;
}

export interface AuditStatusResponse {
  interval: string;
  buckets: AuditStatusBucket[];
}

export interface AuditEventCount {
  event: string;
  count: number;
}

export interface AuditEventsResponse {
  items: AuditEventCount[];
}

export interface AuditStatsParams {
  from: string; // ISO 8601 timestamp
  to: string; // ISO 8601 timestamp
  level?: string;
  event?: string;
  search?: string;
}

const SEARCH_DEBOUNCE_MS = 400;

interface AuditQueryState<T> {
  /** `null` until the first successful response (and after an error). */
  data: T | null;
  loading: boolean;
  error: string;
}

/**
 * Fetch one `/api/audit/stats` aggregation (`type` picks which), auto-refetching
 * whenever the params change. The free-text `search` is debounced so half-typed
 * queries don't each fire a (billed) CloudWatch Logs Insights scan.
 */
function useAuditStatsQuery<T>(
  type: AuditStatsType,
  params: AuditStatsParams,
): AuditQueryState<T> {
  const [state, setState] = useState<AuditQueryState<T>>({
    data: null,
    loading: true,
    error: '',
  });

  // Debounce only the search term; range/level/event apply immediately.
  const [debouncedSearch, setDebouncedSearch] = useState(params.search ?? '');
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(params.search ?? ''),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [params.search]);

  const { from, to, level, event } = params;

  // A ref lets us ignore responses from superseded requests without re-running
  // the effect on every render.
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      setState(prev => ({ ...prev, loading: true, error: '' }));

      fetch('/api/audit/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          level: level || undefined,
          event: event || undefined,
          search: debouncedSearch || undefined,
          type,
        }),
      })
        .then(async res => {
          const body = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(body?.error ?? `Request failed: HTTP ${res.status}`);
          }
          return body as T;
        })
        .then(data => {
          if (cancelled || id !== requestId.current) return;
          setState({ data, loading: false, error: '' });
        })
        .catch(err => {
          if (cancelled || id !== requestId.current) return;
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load stats',
          });
        });
    };

    // Deferred so the effect body never calls setState synchronously.
    queueMicrotask(run);

    return () => {
      cancelled = true;
    };
  }, [type, from, to, level, event, debouncedSearch]);

  return state;
}

interface AuditStatsState {
  buckets: AuditStatsBucket[];
  interval: string;
  loading: boolean;
  error: string;
}

/** Bucketed log volume per level (the original stats shape). */
export function useAuditStats(params: AuditStatsParams): AuditStatsState {
  const { data, loading, error } = useAuditStatsQuery<AuditStatsResponse>(
    'volume',
    params,
  );
  return {
    buckets: data?.buckets ?? [],
    interval: data?.interval ?? '1h',
    loading,
    error,
  };
}

/** Bucketed request latency: avg/p95 of `duration` plus sample counts. */
export function useAuditLatencyStats(params: AuditStatsParams) {
  return useAuditStatsQuery<AuditLatencyResponse>('latency', params);
}

/** Bucketed HTTP responses counted per status class (2xx–5xx). */
export function useAuditStatusStats(params: AuditStatsParams) {
  return useAuditStatsQuery<AuditStatusResponse>('status', params);
}

/** Top 10 most frequent events in the range. */
export function useAuditTopEvents(params: AuditStatsParams) {
  return useAuditStatsQuery<AuditEventsResponse>('events', params);
}
