'use client';

import { useCallback, useRef, useState } from 'react';

import { isAuthError } from '@/lib/fetch-utils';
import {
  REQUEST_DELAY_MS,
  delay,
  formatRangeLabel,
  getCurrentTime,
  isUnlogged,
  statusRange,
} from '@/lib/timesheet';
import type {
  DateRange,
  LogWorkResult,
  RequestStatus,
  RunOutcome,
  TimesheetSettings,
  WorkEntry,
  WorkItem,
} from '@/types/timesheet';

interface SubmitParams {
  entries: WorkEntry[];
  ranges: DateRange[];
}

function statusOf(
  statuses: RequestStatus[],
  entryId: string,
  range: DateRange
): RequestStatus | undefined {
  const label = formatRangeLabel(range);
  return statuses.find(s => s.entryId === entryId && s.rangeLabel === label);
}

/**
 * Per-row results derived from the per-range statuses, so a cancel or an
 * early stop can never drop a row or report unsent ranges as logged. Uses the
 * same `isUnlogged` test as the retry list, so the two always agree.
 */
function deriveResults(
  items: WorkItem[],
  statuses: RequestStatus[]
): LogWorkResult[] {
  return items.map(({ entry }) => {
    const missing = statuses.filter(
      s => s.entryId === entry.id && isUnlogged(s)
    );
    if (missing.length === 0) return { entry, success: true };

    const failures = missing.filter(s => s.status === 'failed');
    const error = failures.length
      ? failures
          .map(s => `${s.rangeLabel}: ${s.error || 'Unknown error'}`)
          .join('; ')
      : 'Cancelled';
    return {
      entry,
      success: false,
      error,
      failedRanges: missing.map(statusRange),
    };
  });
}

export function useLogWorkSubmission(settings: TimesheetSettings) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [hasAuthError, setHasAuthError] = useState(false);
  const [results, setResults] = useState<LogWorkResult[]>([]);
  const [requestStatuses, setRequestStatuses] = useState<RequestStatus[]>([]);
  const abortRef = useRef(false);
  // Mirrors of the current run, readable synchronously when it resolves.
  const statusesRef = useRef<RequestStatus[]>([]);
  const itemsRef = useRef<WorkItem[]>([]);

  const setStatuses = useCallback((next: RequestStatus[]) => {
    statusesRef.current = next;
    setRequestStatuses(next);
  }, []);

  const updateRequestStatus = useCallback(
    (
      entryId: string,
      range: DateRange,
      status: RequestStatus['status'],
      error?: string,
      errorStatus?: number
    ) => {
      const label = formatRangeLabel(range);
      setStatuses(
        statusesRef.current.map(rs =>
          rs.entryId === entryId && rs.rangeLabel === label
            ? { ...rs, status, error, errorStatus }
            : rs
        )
      );
    },
    [setStatuses]
  );

  const cancelSubmission = useCallback(() => {
    abortRef.current = true;
    setIsCancelled(true);
  }, []);

  const submitRange = useCallback(
    async (
      entry: WorkEntry,
      range: DateRange,
      headers: Record<string, string>,
      time: string
    ): Promise<{
      success: boolean;
      error?: string;
      errorStatus?: number;
      isAuthError?: boolean;
    }> => {
      try {
        const response = await fetch('/api/jira/worklogs/logwork', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            jiraInstance: settings.jiraInstance,
            worklog: {
              username: settings.username,
              issueKey: entry.issueKey.trim(),
              timeSpend: entry.hours * 3600,
              startDate: range.startDate,
              endDate: range.endDate,
              typeOfWork: entry.typeOfWork,
              description: entry.description,
              time,
              remainingTime: 0,
              period: false,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          return {
            success: false,
            error: errorData?.error || `HTTP ${response.status}`,
            errorStatus: response.status,
            isAuthError: isAuthError(response.status),
          };
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [settings.jiraInstance, settings.username]
  );

  /**
   * Send `queue` one request per row × range, pausing between requests.
   * Whatever a cancel leaves unsent is marked skipped.
   */
  const runQueue = useCallback(
    async (queue: WorkItem[]): Promise<RunOutcome> => {
      const time = getCurrentTime();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.token}`,
      };

      setIsSubmitting(true);
      setIsCancelled(false);
      setHasAuthError(false);
      abortRef.current = false;

      let sent = 0;
      outer: for (const { entry, ranges } of queue) {
        for (const range of ranges) {
          if (sent > 0) await delay(REQUEST_DELAY_MS);
          if (abortRef.current) break outer;
          sent++;

          updateRequestStatus(entry.id, range, 'in-progress');
          const result = await submitRange(entry, range, headers, time);
          if (result.success) {
            updateRequestStatus(entry.id, range, 'success');
          } else {
            updateRequestStatus(
              entry.id,
              range,
              'failed',
              result.error,
              result.errorStatus
            );
            if (result.isAuthError) setHasAuthError(true);
          }
        }
      }

      setStatuses(
        statusesRef.current.map(s =>
          s.status === 'pending' ? { ...s, status: 'skipped' } : s
        )
      );
      const outcome = {
        results: deriveResults(itemsRef.current, statusesRef.current),
        statuses: statusesRef.current,
      };
      setResults(outcome.results);
      setIsSubmitting(false);
      return outcome;
    },
    [settings.token, submitRange, updateRequestStatus, setStatuses]
  );

  /** Log each row for its own date ranges, one request per row × range. */
  const submitWork = useCallback(
    (items: WorkItem[]): Promise<RunOutcome> => {
      itemsRef.current = items;
      setResults([]);
      setStatuses(
        items.flatMap(({ entry, ranges }) =>
          ranges.map(range => ({
            entryId: entry.id,
            issueKey: entry.issueKey.trim(),
            rangeLabel: formatRangeLabel(range),
            dates: range.dates,
            status: 'pending' as const,
          }))
        )
      );
      return runQueue(items);
    },
    [runQueue, setStatuses]
  );

  const submitEntries = useCallback(
    ({ entries, ranges }: SubmitParams): Promise<RunOutcome> =>
      submitWork(
        entries.filter(e => e.issueKey.trim()).map(entry => ({ entry, ranges }))
      ),
    [submitWork]
  );

  /** Re-send only the ranges of the current run that failed. */
  const retryFailed = useCallback((): Promise<RunOutcome> => {
    const queue = itemsRef.current
      .map(({ entry, ranges }) => ({
        entry,
        ranges: ranges.filter(
          r => statusOf(statusesRef.current, entry.id, r)?.status === 'failed'
        ),
      }))
      .filter(item => item.ranges.length > 0);

    setStatuses(
      statusesRef.current.map(s =>
        s.status === 'failed'
          ? {
              ...s,
              status: 'pending',
              error: undefined,
              errorStatus: undefined,
            }
          : s
      )
    );
    return runQueue(queue);
  }, [runQueue, setStatuses]);

  const resetResults = useCallback(() => {
    itemsRef.current = [];
    setResults([]);
    setStatuses([]);
    setIsCancelled(false);
  }, [setStatuses]);

  return {
    isSubmitting,
    isCancelled,
    hasAuthError,
    results,
    requestStatuses,
    submitEntries,
    submitWork,
    retryFailed,
    cancelSubmission,
    resetResults,
  };
}
