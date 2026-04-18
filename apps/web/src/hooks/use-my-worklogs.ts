'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import { formatDateForApi, getMonthEnd, getMonthStart } from '@/lib/timesheet';
import type { MyWorklogsRow, TimesheetSettings } from '@/types/timesheet';

import { useWorklogMutations } from './use-worklog-mutations';

interface UseMyWorklogsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

export function useMyWorklogs({ settings, isConfigured }: UseMyWorklogsParams) {
  // Filter form state
  const [statusWorklog, setStatusWorklog] = useState('All');
  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getMonthEnd());

  // Results state
  const [worklogs, setWorklogs] = useState<MyWorklogsRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const mutations = useWorklogMutations({
    settings,
    isConfigured,
    worklogs,
    setWorklogs,
  });
  const { clearSelection } = mutations;

  const handleSearch = useCallback(async () => {
    if (!isConfigured) {
      setError('Please configure your Jira settings first.');
      return;
    }
    if (!settings.username) {
      setError('Username is required. Please update your Jira settings.');
      return;
    }
    if (!fromDate || !toDate) {
      setError('Please select a date range.');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError('Start date must be before or equal to end date.');
      return;
    }

    setError('');
    setHasSearched(true);
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        username: settings.username,
        fromDate: formatDateForApi(fromDate),
        toDate: formatDateForApi(toDate),
        statusWorklog,
        jiraInstance: settings.jiraInstance,
      });

      const response = await fetch(
        `/api/timesheet/worklogs?${params.toString()}`,
        { headers: { Authorization: `Bearer ${settings.token}` } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch: HTTP ${response.status}`
        );
      }

      const data = await response.json();
      const rows: MyWorklogsRow[] = Array.isArray(data)
        ? data
        : (data.rows ?? data.data ?? []);

      setWorklogs(rows);
      clearSelection();
      toast.success(`Loaded ${rows.length} entries`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch worklogs';
      setError(message);
      toast.error(message);
      setWorklogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, settings, fromDate, toDate, statusWorklog, clearSelection]);

  return {
    // Filter form
    statusWorklog,
    setStatusWorklog,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    // Results
    worklogs,
    isLoading,
    error,
    hasSearched,
    // Mutations (delete, edit, selection, bulk delete)
    ...mutations,
    // Actions
    handleSearch,
  };
}
