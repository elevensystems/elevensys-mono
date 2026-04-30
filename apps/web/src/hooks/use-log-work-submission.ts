'use client';

import { useCallback, useRef, useState } from 'react';

import { REQUEST_DELAY_MS, delay, formatRangeLabel, getCurrentTime } from '@/lib/timesheet';
import type {
  DateRange,
  LogWorkResult,
  RequestStatus,
  TimesheetSettings,
  WorkEntry,
} from '@/types/timesheet';

interface SubmitParams {
  entries: WorkEntry[];
  ranges: DateRange[];
}

interface RetryParams {
  failedResults: LogWorkResult[];
}

export function useLogWorkSubmission(settings: TimesheetSettings) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [results, setResults] = useState<LogWorkResult[]>([]);
  const [requestStatuses, setRequestStatuses] = useState<RequestStatus[]>([]);
  const abortRef = useRef(false);

  const updateRequestStatus = useCallback(
    (
      entryId: string,
      rangeLabel: string,
      status: RequestStatus['status'],
      error?: string
    ) => {
      setRequestStatuses(prev =>
        prev.map(rs =>
          rs.entryId === entryId && rs.rangeLabel === rangeLabel
            ? { ...rs, status, error }
            : rs
        )
      );
    },
    []
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
    ): Promise<{ success: boolean; error?: string }> => {
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
          throw new Error(errorData?.error || `HTTP ${response.status}`);
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

  const submitEntries = useCallback(
    async ({ entries, ranges }: SubmitParams): Promise<LogWorkResult[]> => {
      const validEntries = entries.filter(e => e.issueKey.trim());
      const time = getCurrentTime();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.token}`,
      };

      // Pre-build all request statuses (one per entry × range)
      const initialStatuses: RequestStatus[] = validEntries.flatMap(entry =>
        ranges.map(range => ({
          entryId: entry.id,
          issueKey: entry.issueKey.trim(),
          rangeLabel: formatRangeLabel(range),
          dates: range.dates,
          status: 'pending' as const,
        }))
      );

      setRequestStatuses(initialStatuses);
      setIsSubmitting(true);
      setIsCancelled(false);
      setResults([]);
      abortRef.current = false;

      const logResults: LogWorkResult[] = [];

      for (const entry of validEntries) {
        const failedRanges: DateRange[] = [];
        const entryErrors: string[] = [];
        let successCount = 0;

        for (let i = 0; i < ranges.length; i++) {
          const range = ranges[i];
          const label = formatRangeLabel(range);

          if (abortRef.current) {
            // Mark remaining as skipped
            updateRequestStatus(entry.id, label, 'skipped');
            for (let j = i + 1; j < ranges.length; j++) {
              updateRequestStatus(entry.id, formatRangeLabel(ranges[j]), 'skipped');
            }
            // Also mark remaining entries as skipped
            const entryIdx = validEntries.indexOf(entry);
            for (let k = entryIdx + 1; k < validEntries.length; k++) {
              for (const r of ranges) {
                updateRequestStatus(validEntries[k].id, formatRangeLabel(r), 'skipped');
              }
            }
            if (successCount > 0 || failedRanges.length > 0) {
              logResults.push({
                entry,
                success: failedRanges.length === 0 && successCount > 0,
                error:
                  failedRanges.length > 0 ? entryErrors.join('; ') : undefined,
                failedRanges: failedRanges.length > 0 ? failedRanges : undefined,
              });
            }
            for (let k = entryIdx + 1; k < validEntries.length; k++) {
              logResults.push({
                entry: validEntries[k],
                success: false,
                error: 'Cancelled',
              });
            }
            break;
          }

          updateRequestStatus(entry.id, label, 'in-progress');

          const result = await submitRange(entry, range, headers, time);

          if (result.success) {
            updateRequestStatus(entry.id, label, 'success');
            successCount++;
          } else {
            updateRequestStatus(entry.id, label, 'failed', result.error);
            failedRanges.push(range);
            entryErrors.push(`${label}: ${result.error || 'Unknown error'}`);
          }

          if (i < ranges.length - 1) {
            await delay(REQUEST_DELAY_MS);
          }
        }

        if (abortRef.current) break;

        if (entryErrors.length === 0) {
          logResults.push({ entry, success: true });
        } else if (successCount > 0) {
          logResults.push({
            entry,
            success: false,
            error: `${successCount}/${ranges.length} ranges succeeded. Failures: ${entryErrors.join('; ')}`,
            failedRanges,
          });
        } else {
          logResults.push({
            entry,
            success: false,
            error: entryErrors.join('; '),
            failedRanges,
          });
        }

        if (
          !abortRef.current &&
          validEntries.indexOf(entry) < validEntries.length - 1
        ) {
          await delay(REQUEST_DELAY_MS);
        }
      }

      setResults(logResults);
      setIsSubmitting(false);

      return logResults;
    },
    [settings.token, submitRange, updateRequestStatus]
  );

  const retryFailed = useCallback(
    async ({ failedResults }: RetryParams): Promise<LogWorkResult[]> => {
      const time = getCurrentTime();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.token}`,
      };

      // Reset failed statuses to pending
      setRequestStatuses(prev =>
        prev.map(rs =>
          rs.status === 'failed'
            ? { ...rs, status: 'pending', error: undefined }
            : rs
        )
      );

      setIsSubmitting(true);
      setIsCancelled(false);
      abortRef.current = false;

      const logResults: LogWorkResult[] = [];

      for (let i = 0; i < failedResults.length; i++) {
        const { entry, failedRanges } = failedResults[i];

        const ranges = failedRanges && failedRanges.length > 0 ? failedRanges : [];

        if (ranges.length === 0) {
          logResults.push({
            entry,
            success: false,
            error: 'No ranges to retry',
          });
          continue;
        }

        const entryFailedRanges: DateRange[] = [];
        const entryErrors: string[] = [];
        let successCount = 0;

        for (let j = 0; j < ranges.length; j++) {
          const range = ranges[j];
          const label = formatRangeLabel(range);

          if (abortRef.current) {
            updateRequestStatus(entry.id, label, 'skipped');
            for (let k = j + 1; k < ranges.length; k++) {
              updateRequestStatus(entry.id, formatRangeLabel(ranges[k]), 'skipped');
            }
            break;
          }

          updateRequestStatus(entry.id, label, 'in-progress');

          const result = await submitRange(entry, range, headers, time);

          if (result.success) {
            updateRequestStatus(entry.id, label, 'success');
            successCount++;
          } else {
            updateRequestStatus(entry.id, label, 'failed', result.error);
            entryFailedRanges.push(range);
            entryErrors.push(`${label}: ${result.error || 'Unknown error'}`);
          }

          if (j < ranges.length - 1) {
            await delay(REQUEST_DELAY_MS);
          }
        }

        if (entryErrors.length === 0) {
          logResults.push({ entry, success: true });
        } else if (successCount > 0) {
          logResults.push({
            entry,
            success: false,
            error: `${successCount}/${ranges.length} succeeded. Failures: ${entryErrors.join('; ')}`,
            failedRanges: entryFailedRanges,
          });
        } else {
          logResults.push({
            entry,
            success: false,
            error: entryErrors.join('; '),
            failedRanges: entryFailedRanges,
          });
        }

        if (abortRef.current) break;

        if (i < failedResults.length - 1) {
          await delay(REQUEST_DELAY_MS);
        }
      }

      setResults(logResults);
      setIsSubmitting(false);

      return logResults;
    },
    [settings.token, submitRange, updateRequestStatus]
  );

  const resetResults = useCallback(() => {
    setResults([]);
    setRequestStatuses([]);
    setIsCancelled(false);
  }, []);

  return {
    isSubmitting,
    isCancelled,
    results,
    requestStatuses,
    submitEntries,
    retryFailed,
    cancelSubmission,
    resetResults,
  };
}
