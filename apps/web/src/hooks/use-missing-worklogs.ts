'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { showAuthErrorToast } from '@/lib/auth-toast';
import { isAuthError } from '@/lib/fetch-utils';
import { formatDateForApi, getMonthEnd, getMonthStart } from '@/lib/timesheet';
import type {
  TimesheetSettings,
  WorklogsWarningEntry,
} from '@/types/timesheet';

import { useProjectIssues } from './use-project-issues';
import { useProjects } from './use-projects';

interface UseMissingWorklogsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

export function useMissingWorklogs({
  settings,
  isConfigured,
}: UseMissingWorklogsParams) {
  const router = useRouter();

  const {
    projects,
    isLoading: isLoadingProjects,
    authError,
    selectedProject,
    setSelectedProject,
  } = useProjects({ settings, isConfigured });

  const selectedProjectId = selectedProject?.id ?? '';

  const setSelectedProjectId = useCallback(
    (id: string) => {
      const project = projects.find(p => p.id === id) ?? null;
      setSelectedProject(project);
    },
    [projects, setSelectedProject]
  );

  const [warningFromDate, setWarningFromDate] = useState(getMonthStart());
  const [warningToDate, setWarningToDate] = useState(getMonthEnd());
  const [isSearchingWarnings, setIsSearchingWarnings] = useState(false);

  const { issues, issuesByKey, isLoadingIssues, fetchIssueTypeOfWork } =
    useProjectIssues({
      projectId: selectedProjectId,
      token: settings.token,
      jiraInstance: settings.jiraInstance,
      enabled: isConfigured,
    });

  const handleSearchWarnings = useCallback(async (): Promise<{
    dates: string;
    count: number;
  } | null> => {
    if (!selectedProjectId) {
      toast.error('Please select a project.');
      return null;
    }
    if (!warningFromDate || !warningToDate) {
      toast.error('Please select a date range.');
      return null;
    }

    setIsSearchingWarnings(true);
    try {
      const response = await fetch('/api/jira/project-worklogs/warning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.token}`,
        },
        body: JSON.stringify({
          pid: selectedProjectId,
          startDate: formatDateForApi(warningFromDate),
          endDate: formatDateForApi(warningToDate),
          jiraInstance: settings.jiraInstance,
        }),
      });

      if (!response.ok) {
        if (isAuthError(response.status)) {
          showAuthErrorToast(() => router.push('/timesheet/config'));
          return null;
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const allDates = result.data
          .map((entry: WorklogsWarningEntry) => entry.value)
          .filter(Boolean)
          .join(', ');
        if (allDates) {
          return {
            dates: allDates,
            count: result.data.length,
          };
        }
        return { dates: '', count: 0 };
      }
      return { dates: '', count: 0 };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to search warnings';
      toast.error(message);
      return null;
    } finally {
      setIsSearchingWarnings(false);
    }
  }, [
    selectedProjectId,
    warningFromDate,
    warningToDate,
    settings.jiraInstance,
    settings.token,
    router,
  ]);

  return {
    projects,
    authError,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    issues,
    issuesByKey,
    isLoadingProjects,
    isLoadingIssues,
    warningFromDate,
    setWarningFromDate,
    warningToDate,
    setWarningToDate,
    isSearchingWarnings,
    handleSearchWarnings,
    fetchIssueTypeOfWork,
  };
}
