'use client';

import { useCallback, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { normalizeAbsence } from '@/app/absences/_components/absences-utils';
import { showAuthErrorToast } from '@/lib/auth-toast';
import { isAuthError } from '@/lib/fetch-utils';
import { formatDateForApi, getMonthEnd, getMonthStart } from '@/lib/timesheet';
import type {
  AbsenceRow,
  AbsencesData,
  TimesheetSettings,
} from '@/types/timesheet';

import { useProjects } from './use-projects';

interface UseAbsencesParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

interface CommittedFilters {
  projectId: string;
  filterUsername: string;
  filterFromDate: string;
  filterToDate: string;
}

/**
 * Drives the Absences page: project leave records for a project and date range.
 * Paginated upstream — `/api/jira/absences` merges the row page with its
 * page-info metadata in a single request.
 */
export function useAbsences({ settings, isConfigured }: UseAbsencesParams) {
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
  const [rows, setRows] = useState<AbsenceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  // Store last committed filters so paging does not pick up edited-but-unsearched values
  const lastFiltersRef = useRef<CommittedFilters | null>(null);

  const fetchPage = useCallback(
    async (filters: CommittedFilters, page: number) => {
      setIsLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          projectId: filters.projectId,
          filterUsername: filters.filterUsername,
          filterFromDate: filters.filterFromDate,
          filterToDate: filters.filterToDate,
          pageNo: String(page),
          jiraInstance: settings.jiraInstance,
        });

        const response = await fetch(
          `/api/jira/absences?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${settings.token}` },
          }
        );

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

        if (result.success && result.data) {
          const data = result.data as AbsencesData;
          const parsed = (data.rows ?? []).map(normalizeAbsence);

          setRows(parsed);
          setCurrentPage(data.page ?? page);
          setTotalPages(data.totalPages ?? 0);
          setTotalRecords(data.totalRecords ?? parsed.length);

          if (parsed.length === 0) {
            toast.info('No absences for this range.');
          } else {
            toast.success(
              `Loaded ${parsed.length} absence${parsed.length !== 1 ? 's' : ''}`
            );
          }
        } else {
          setRows([]);
          setTotalPages(0);
          setTotalRecords(0);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch absences';
        setError(message);
        toast.error(message);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    },
    [settings.token, settings.jiraInstance, router]
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
      projectId: selectedProject.id,
      // An empty username asks for every member of the project.
      filterUsername: username.trim() || 'All',
      filterFromDate: formatDateForApi(fromDate),
      filterToDate: formatDateForApi(toDate),
    };

    lastFiltersRef.current = filters;
    await fetchPage(filters, 1);
  }, [isConfigured, selectedProject, fromDate, toDate, username, fetchPage]);

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
    // Pagination
    currentPage,
    totalPages,
    totalRecords,
    // Actions
    handleSearch,
    goToPage,
  };
}
