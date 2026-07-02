'use client';

import { useCallback, useState } from 'react';

export interface LogEntry {
  timestamp: string;
  level: string;
  event?: string;
  operation?: string;
  jiraInstance?: string;
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  username?: string;
  issueKey?: string;
  reqId?: string;
  message?: string;
}

export interface LogsQueryParams {
  from: string;
  to: string;
  level?: string;
  event?: string;
  search?: string;
  limit?: string;
}

export function useSystemLogs() {
  const [items, setItems] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async (params: LogsQueryParams) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      query.set('from', params.from);
      query.set('to', params.to);
      if (params.level) query.set('level', params.level);
      if (params.event) query.set('event', params.event);
      if (params.search) query.set('search', params.search);
      if (params.limit) query.set('limit', params.limit);

      const res = await fetch(`/api/audit?${query.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed: HTTP ${res.status}`);
      }
      const data = await res.json() as { items: LogEntry[] };
      setItems(data.items ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit logs';
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, error, fetchLogs };
}
