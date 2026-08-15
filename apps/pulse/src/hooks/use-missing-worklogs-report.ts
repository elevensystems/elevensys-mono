'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { showAuthErrorToast } from '@/lib/auth-toast';
import { isAuthError } from '@/lib/fetch-utils';
import {
  formatDateForApi,
  getMonthEnd,
  getMonthStart,
  parseWarningEntries,
} from '@/lib/timesheet';
import type {
  MissingWorklogUser,
  TimesheetSettings,
  WorklogsWarningEntry,
} from '@/types/timesheet';

import { useProjects } from './use-projects';

interface UseMissingWorklogsReportParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

/**
 * Drives the Missing Worklogs page: which users on a project still owe worklogs
 * for a date range. Unlike `useMissingWorklogs` (Log Work), which flattens the
 * same endpoint into a single list of dates, this keeps one row per user.
 */
export function useMissingWorklogsReport({
  settings,
  isConfigured,
}: UseMissingWorklogsReportParams) {
  const router = useRouter();

  const {
    projects,
    isLoading: projectsLoading,
    authError,
    selectedProject,
    setSelectedProject,
  } = useProjects({ settings, isConfigured });

  // Filter form state
  const [username, setUsername] = useState('');
  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getMonthEnd());

  // Results state
  const [rows, setRows] = useState<MissingWorklogUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!isConfigured) {
      setError('Please configure your Jira settings first.');
      return;
    }
    if (!selectedProject) {
      setError('Please select a project.');
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
      const response = await fetch('/api/jira/project-worklogs/warning/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.token}`,
        },
        body: JSON.stringify({
          pid: Number(selectedProject.id),
          startDate: formatDateForApi(fromDate),
          endDate: formatDateForApi(toDate),
          username: username.trim(),
          jiraInstance: settings.jiraInstance,
        }),
      });

      if (!response.ok) {
        if (isAuthError(response.status)) {
          showAuthErrorToast(() => router.push('/config'));
          setRows([]);
          return;
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch: HTTP ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const parsed = parseWarningEntries(
          result.data as WorklogsWarningEntry[]
        );
        setRows(parsed);
        if (parsed.length === 0) {
          toast.info('No missing worklogs for this range.');
        } else {
          toast.success(
            `${parsed.length} user${parsed.length !== 1 ? 's' : ''} with missing worklogs`
          );
        }
      } else {
        setRows([]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch missing worklogs';
      setError(message);
      toast.error(message);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isConfigured,
    selectedProject,
    fromDate,
    toDate,
    username,
    settings.token,
    settings.jiraInstance,
    router,
  ]);

  return {
    // Projects list
    projects,
    projectsLoading,
    authError,
    // Filter form
    selectedProject,
    setSelectedProject,
    username,
    setUsername,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    // Results
    rows,
    isLoading,
    error,
    hasSearched,
    // Actions
    handleSearch,
  };
}
