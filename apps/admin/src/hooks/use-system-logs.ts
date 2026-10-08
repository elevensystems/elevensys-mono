'use client';

import { useCallback, useState } from 'react';

import { readErrorMessage } from '@workspace/ui/lib/http';

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
  limit?: number;
}

export function useSystemLogs() {
  const [items, setItems] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async (params: LogsQueryParams) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        throw new Error(
          await readErrorMessage(res, `Request failed: HTTP ${res.status}`)
        );
      }
      const data = (await res.json()) as { items: LogEntry[] };
      setItems(data.items ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch audit logs';
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, error, fetchLogs };
}
