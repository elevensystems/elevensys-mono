'use client';

import { useCallback, useRef, useState } from 'react';

import { toast } from 'sonner';

import { formatDateForApi, getMonthEnd, getMonthStart } from '@/lib/timesheet';
import type {
  MyWorklogsData,
  MyWorklogsRow,
  TimesheetSettings,
} from '@/types/timesheet';

import { useProjects } from './use-projects';
import { getWorklogKey, useWorklogMutations } from './use-worklog-mutations';

export { getWorklogKey };

interface UseWorklogsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

interface CommittedFilters {
  projectKey: string;
  fromDate: string;
  toDate: string;
  statusWorklog: string;
  jiraInstance: string;
}

export function useWorklogs({ settings, isConfigured }: UseWorklogsParams) {
  const {
    projects,
    isLoading: projectsLoading,
    selectedProject,
    setSelectedProject,
  } = useProjects({ settings, isConfigured });

  // Filter form state
  const [statusWorklog, setStatusWorklog] = useState('All');
  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getMonthEnd());

  // Results state
  const [worklogs, setWorklogs] = useState<MyWorklogsRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageStart, setPageStart] = useState(0);
  const [pageEnd, setPageEnd] = useState(0);

  // Store last committed filters for pagination
  const lastFiltersRef = useRef<CommittedFilters | null>(null);

  const mutations = useWorklogMutations({
    settings,
    isConfigured,
    worklogs,
    setWorklogs,
  });
  const { clearSelection } = mutations;

  const fetchPage = useCallback(
    async (filters: CommittedFilters, page: number) => {
      setIsLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          projectKey: filters.projectKey,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          statusWorklog: filters.statusWorklog,
          page: String(page),
          jiraInstance: filters.jiraInstance,
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

        const result = await response.json();

        if (result.success && result.data) {
          const data = result.data as MyWorklogsData;
          setWorklogs(data.rows ?? []);
          setCurrentPage(page);
          const pages =
            data.pageSize > 0 ? Math.ceil(data.records / data.pageSize) : 0;
          setTotalPages(pages);
          setTotalRecords(data.records);
          setPageStart(data.start);
          setPageEnd(data.end);
          clearSelection();
          toast.success(`Loaded ${data.rows?.length ?? 0} entries`);
        } else {
          setWorklogs([]);
          setTotalPages(0);
          setTotalRecords(0);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch worklogs';
        setError(message);
        toast.error(message);
        setWorklogs([]);
      } finally {
        setIsLoading(false);
      }
    },
    [settings.token, clearSelection]
  );

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

    const filters: CommittedFilters = {
      projectKey: selectedProject.key,
      fromDate: formatDateForApi(fromDate),
      toDate: formatDateForApi(toDate),
      statusWorklog,
      jiraInstance: settings.jiraInstance,
    };

    lastFiltersRef.current = filters;
    await fetchPage(filters, 1);
  }, [
    isConfigured,
    selectedProject,
    fromDate,
    toDate,
    statusWorklog,
    settings.jiraInstance,
    fetchPage,
  ]);

  const goToPage = useCallback(
    async (page: number) => {
      if (!lastFiltersRef.current) return;
      await fetchPage(lastFiltersRef.current, page);
    },
    [fetchPage]
  );

  return {
    // Projects list
    projects,
    projectsLoading,
    // Filter form
    selectedProject,
    setSelectedProject,
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
    // Pagination
    currentPage,
    totalPages,
    totalRecords,
    pageStart,
    pageEnd,
    // Mutations (delete, edit, selection, bulk delete)
    ...mutations,
    // Actions
    handleSearch,
    goToPage,
  };
}
