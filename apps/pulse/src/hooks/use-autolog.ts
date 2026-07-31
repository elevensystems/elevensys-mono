'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { MAX_AUTOLOG_CONFIGS } from '@/lib/constants';
import type {
  AutologConfig,
  CreateAutologConfigPayload,
  UpdateAutologConfigPayload,
} from '@/types/autolog';

interface UseAutologParams {
  username: string;
  token: string;
  isConfigured: boolean;
}

export function useAutolog({
  username,
  token,
  isConfigured,
}: UseAutologParams) {
  const [configs, setConfigs] = useState<AutologConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const fetchConfigs = useCallback(async () => {
    if (!isConfigured) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/jira/autolog?username=${encodeURIComponent(username)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConfigs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load autolog configurations');
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, username, token]);

  useEffect(() => {
    (async () => {
      await fetchConfigs();
    })();
  }, [fetchConfigs]);

  const createConfig = useCallback(
    async (payload: CreateAutologConfigPayload): Promise<boolean> => {
      try {
        const res = await fetch('/api/jira/autolog', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || `HTTP ${res.status}`);
        }
        const newConfig: AutologConfig = await res.json();
        setConfigs(prev => [...prev, newConfig]);
        toast.success('Autolog configuration created');
        return true;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to create configuration'
        );
        return false;
      }
    },
    [authHeaders]
  );

  const updateConfig = useCallback(
    async (
      configId: string,
      payload: UpdateAutologConfigPayload
    ): Promise<boolean> => {
      try {
        const res = await fetch(`/api/jira/autolog/${configId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || `HTTP ${res.status}`);
        }
        const updated: AutologConfig = await res.json();
        setConfigs(prev =>
          prev.map(c => (c.configId === configId ? updated : c))
        );
        toast.success('Configuration updated');
        return true;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to update configuration'
        );
        return false;
      }
    },
    [authHeaders]
  );

  const deleteConfig = useCallback(
    async (configId: string): Promise<boolean> => {
      try {
        const res = await fetch(
          `/api/jira/autolog/${configId}?username=${encodeURIComponent(username)}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || `HTTP ${res.status}`);
        }
        setConfigs(prev => prev.filter(c => c.configId !== configId));
        toast.success('Configuration deleted');
        return true;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to delete configuration'
        );
        return false;
      }
    },
    [username, token]
  );

  const runConfig = useCallback(
    async (configId: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/jira/autolog/${configId}/run`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ username }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || `HTTP ${res.status}`);
        }
        toast.success('Manual run triggered successfully');
        return true;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to trigger run'
        );
        return false;
      }
    },
    [authHeaders, username]
  );

  return {
    configs,
    isLoading,
    fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    runConfig,
    canAddMore: configs.length < MAX_AUTOLOG_CONFIGS,
  };
}
