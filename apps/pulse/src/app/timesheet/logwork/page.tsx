'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@workspace/ui/components/button';
import { FieldMessage } from '@workspace/ui/components/field-message';
import { Spinner } from '@workspace/ui/components/spinner';
import { cn } from '@workspace/ui/lib/utils';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import { TokenExpiredAlert } from '@/components/features/timesheet/token-expired-alert';
import { WorkEntriesFrame } from '@/components/features/timesheet/work-entries-frame';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useLogWorkSubmission } from '@/hooks/use-log-work-submission';
import { useMissingWorklogs } from '@/hooks/use-missing-worklogs';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { showAuthErrorToast } from '@/lib/auth-toast';
import {
  createDefaultEntry,
  formatDateForApi,
  groupDatesIntoRanges,
  isValidIssueKey,
  loadSavedEntries,
  saveEntriesToStorage,
} from '@/lib/timesheet';
import type {
  DateRange,
  LogWorkResult,
  RowErrors,
  ValidationErrors,
  WorkEntry,
} from '@/types/timesheet';

import { ConfirmDialog } from './_components/confirm-dialog';
import { LogworkStep, LogworkStepper } from './_components/logwork-stepper';
import { MissingWorklogsCard } from './_components/missing-worklogs-card';
import { SubmissionModal } from './_components/submission-modal';

/** Convert a Date to DD/Mon/YY API format */
function dateToApiFormat(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return formatDateForApi(`${y}-${m}-${d}`);
}

export default function LogWorkPage() {
  const router = useRouter();
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();

  const {
    selectedProjectId,
    selectedProject,
    issues,
    issuesByKey,
    isLoadingIssues,
    authError,
    warningFromDate,
    setWarningFromDate,
    warningToDate,
    setWarningToDate,
    isSearchingWarnings,
    handleSearchWarnings,
  } = useMissingWorklogs({ settings, isConfigured });

  const {
    isSubmitting,
    isCancelled,
    hasAuthError,
    results,
    requestStatuses,
    submitEntries,
    retryFailed,
    cancelSubmission,
    resetResults,
  } = useLogWorkSubmission(settings);

  const [entries, setEntries] = useState<WorkEntry[]>([createDefaultEntry()]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({
    global: {},
    rows: new Map(),
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const pendingResultsRef = useRef<LogWorkResult[]>([]);

  // Derive parsedDates (DD/Mon/YY strings) from selectedDates
  const parsedDates = useMemo(
    () =>
      [...selectedDates]
        .sort((a, b) => a.getTime() - b.getTime())
        .map(dateToApiFormat),
    [selectedDates]
  );

  // Group consecutive dates into ranges for bulk submission
  const dateRanges = useMemo<DateRange[]>(
    () => groupDatesIntoRanges(parsedDates),
    [parsedDates]
  );

  const clearAllDates = useCallback(() => setSelectedDates([]), []);

  const clearRowError = useCallback(
    (entryId: string, field: keyof RowErrors) => {
      setErrors(prev => {
        const rowErrors = prev.rows.get(entryId);
        if (!rowErrors) return prev;
        const updated = { ...rowErrors };
        delete updated[field];
        const nextRows = new Map(prev.rows);
        if (updated.issueKey || updated.description) {
          nextRows.set(entryId, updated);
        } else {
          nextRows.delete(entryId);
        }
        return { ...prev, rows: nextRows };
      });
    },
    []
  );

  // Warn before navigating away if there are unsaved entries
  useEffect(() => {
    const hasEntries = entries.some(e => e.issueKey.trim());
    if (!hasEntries) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [entries]);

  // Entries are per-project drafts, but the project now comes from the header
  // switcher and can change at any time — so stash the current entries under
  // the outgoing project before swapping in the incoming project's draft.
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const previousProjectIdRef = useRef(selectedProjectId);
  useEffect(() => {
    const previousProjectId = previousProjectIdRef.current;
    if (previousProjectId === selectedProjectId) return;
    previousProjectIdRef.current = selectedProjectId;

    if (previousProjectId) {
      saveEntriesToStorage(entriesRef.current, previousProjectId);
    }
    setEntries(
      selectedProjectId
        ? loadSavedEntries(selectedProjectId)
        : [createDefaultEntry()]
    );
  }, [selectedProjectId]);

  const validEntryCount = useMemo(
    () => entries.filter(e => e.issueKey.trim()).length,
    [entries]
  );

  const totalHours = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.hours || 0), 0),
    [entries]
  );

  const addEntry = useCallback(() => {
    setEntries(prev => [...prev, createDefaultEntry()]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev =>
      prev.length > 1 ? prev.filter(e => e.id !== id) : prev
    );
  }, []);

  const updateEntry = useCallback(
    (id: string, field: keyof WorkEntry, value: string | number) => {
      setEntries(prev =>
        prev.map(entry =>
          entry.id === id ? { ...entry, [field]: value } : entry
        )
      );
    },
    []
  );

  const validateEntries = useCallback((): ValidationErrors => {
    const result: ValidationErrors = { global: {}, rows: new Map() };

    if (!isConfigured) {
      result.global.config = 'Please configure your Jira settings first.';
    }

    if (parsedDates.length === 0) {
      result.global.dates = 'Please select at least one date.';
    }

    const validEntries = entries.filter(e => e.issueKey.trim());
    if (validEntries.length === 0) {
      result.global.entries =
        'Please add at least one work entry with an issue key.';
    }

    for (const entry of validEntries) {
      const rowErrors: RowErrors = {};
      if (!isValidIssueKey(entry.issueKey)) {
        rowErrors.issueKey = 'Expected format: PROJECT-123';
      }
      if (!entry.description.trim()) {
        rowErrors.description = 'Description is required';
      }
      if (rowErrors.issueKey || rowErrors.description) {
        result.rows.set(entry.id, rowErrors);
      }
    }

    return result;
  }, [isConfigured, parsedDates, entries]);

  const hasErrors = useCallback(
    (v: ValidationErrors) =>
      Object.values(v.global).some(Boolean) || v.rows.size > 0,
    []
  );

  const handleSubmitClick = useCallback(() => {
    const validationResult = validateEntries();
    setErrors(validationResult);
    if (hasErrors(validationResult)) return;
    setShowConfirmDialog(true);
  }, [validateEntries, hasErrors]);

  const processResults = useCallback(
    (logResults: LogWorkResult[]) => {
      const successCount = logResults.filter(r => r.success).length;
      const errorCount = logResults.filter(r => !r.success).length;

      if (errorCount === 0) {
        toast.success(`All ${successCount} entries logged successfully!`, {
          action: {
            label: 'View Worklogs',
            onClick: () => router.push('/timesheet/my-worklogs'),
          },
          duration: 10000,
        });
        return;
      }

      if (hasAuthError) {
        showAuthErrorToast(() => router.push('/config'));
      } else if (successCount > 0) {
        toast.warning(`${successCount} succeeded, ${errorCount} failed`);
      } else {
        toast.error(`All ${errorCount} entries failed`);
      }

      if (successCount > 0) {
        const failedIssueKeys = new Set(
          logResults.filter(r => !r.success).map(r => r.entry.issueKey)
        );
        setEntries(prev => prev.filter(e => failedIssueKeys.has(e.issueKey)));
      }
    },
    [router, hasAuthError]
  );

  const handleLogWork = useCallback(async () => {
    setShowConfirmDialog(false);
    setSubmissionModalOpen(true);

    const validEntries = entries.filter(e => e.issueKey.trim());
    saveEntriesToStorage(validEntries, selectedProjectId);

    const logResults = await submitEntries({
      entries,
      ranges: dateRanges,
    });

    // Results are processed when modal closes
    pendingResultsRef.current = logResults;
  }, [entries, dateRanges, selectedProjectId, submitEntries]);

  const handleRetryFailed = useCallback(async () => {
    const failedResults = results.filter(
      r => !r.success && r.error !== 'Cancelled'
    );
    if (failedResults.length === 0) return;

    const logResults = await retryFailed({
      failedResults,
    });

    pendingResultsRef.current = logResults;
  }, [results, retryFailed]);

  const handleSubmissionModalClose = useCallback(() => {
    setSubmissionModalOpen(false);
    const logResults = pendingResultsRef.current;
    pendingResultsRef.current = [];
    if (logResults.length > 0) {
      processResults(logResults);
    }
    resetResults();
  }, [processResults, resetResults]);

  if (!isLoaded) {
    return (
      <MainLayout>
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-40">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        </section>
      </MainLayout>
    );
  }

  // 3 marks both steps complete — there is no third step to land on
  const currentStep = ((): 1 | 2 | 3 => {
    if (isSubmitting) return 3;
    if (selectedDates.length > 0 && entries.some(e => e.issueKey.trim()))
      return 3;
    if (selectedDates.length > 0) return 2;
    return 1;
  })();

  const requestCount = validEntryCount * dateRanges.length;
  const isReadyToSubmit = parsedDates.length > 0 && validEntryCount > 0;

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ToolPageHeader
              title="Log Work"
              subtitle={
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedProject
                    ? selectedProject.name
                    : 'Choose a project in the header to get started.'}
                </p>
              }
              className=""
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmitClick}
                disabled={isSubmitting || !isConfigured || !selectedProject}
                title={
                  isReadyToSubmit
                    ? `Will send ${requestCount} request${requestCount !== 1 ? 's' : ''} (${validEntryCount} entr${validEntryCount !== 1 ? 'ies' : 'y'} × ${dateRanges.length} range${dateRanges.length !== 1 ? 's' : ''}) covering ${parsedDates.length} date${parsedDates.length !== 1 ? 's' : ''}`
                    : undefined
                }
              >
                {isSubmitting ? <Spinner /> : <Send />}
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>

          <NotConfiguredAlert isConfigured={isConfigured} />

          {isConfigured && <TokenExpiredAlert authError={authError} />}

          <LogworkStepper currentStep={currentStep}>
            <LogworkStep step={1} title="Select dates">
              <MissingWorklogsCard
                selectedProjectId={selectedProjectId}
                warningFromDate={warningFromDate}
                warningToDate={warningToDate}
                onWarningFromDateChange={setWarningFromDate}
                onWarningToDateChange={setWarningToDate}
                isSearchingWarnings={isSearchingWarnings}
                onSearchWarnings={handleSearchWarnings}
                selectedDates={selectedDates}
                onSelectedDatesChange={dates => {
                  setSelectedDates(dates);
                  setErrors(prev =>
                    prev.global.dates
                      ? {
                          ...prev,
                          global: { ...prev.global, dates: undefined },
                        }
                      : prev
                  );
                }}
                parsedDates={parsedDates}
                onClearAllDates={clearAllDates}
                includeWeekends={includeWeekends}
                onIncludeWeekendsChange={setIncludeWeekends}
                dateError={errors.global.dates}
              />
            </LogworkStep>

            <LogworkStep step={2} title="Add worklogs" isLast>
              {/* The frame is the validated control: the error ring stays on it
                and the message sits in the tinted strip below. */}
              <FieldMessage
                state="error"
                message={errors.global.entries}
                className="rounded-xl"
                controlClassName="rounded-xl border-0 bg-background"
                showIcon
              >
                <WorkEntriesFrame
                  entries={entries}
                  issues={issues}
                  issuesByKey={issuesByKey}
                  isLoadingIssues={isLoadingIssues}
                  onUpdate={updateEntry}
                  onRemove={removeEntry}
                  onAdd={addEntry}
                  addDisabled={isSubmitting || !isConfigured}
                  rowErrors={errors.rows}
                  onClearRowError={clearRowError}
                  className={cn(errors.global.entries && 'border-destructive')}
                />
              </FieldMessage>
            </LogworkStep>
          </LogworkStepper>
        </div>

        <SubmissionModal
          open={submissionModalOpen}
          onClose={handleSubmissionModalClose}
          isSubmitting={isSubmitting}
          isCancelled={isCancelled}
          requestStatuses={requestStatuses}
          results={results}
          onCancel={cancelSubmission}
          onRetryFailed={handleRetryFailed}
        />

        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleLogWork}
          entries={entries}
          parsedDates={parsedDates}
          dateRanges={dateRanges}
          selectedProject={selectedProject ?? undefined}
          totalHours={totalHours}
        />
      </section>
    </MainLayout>
  );
}
