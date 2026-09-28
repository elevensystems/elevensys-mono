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
import { WorkEntriesPanel } from '@/components/features/timesheet/work-entries-panel';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useFailedWorklogs } from '@/hooks/use-failed-worklogs';
import { useLogWorkSubmission } from '@/hooks/use-log-work-submission';
import { useMissingWorklogs } from '@/hooks/use-missing-worklogs';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { useWorklogProfiles } from '@/hooks/use-worklog-profiles';
import { showAuthErrorToast } from '@/lib/auth-toast';
import {
  createDefaultEntry,
  formatDateForApi,
  groupDatesIntoRanges,
  isValidIssueKey,
  reconcileFailedWorklogs,
} from '@/lib/timesheet';
import type {
  DateRange,
  LogWorkResult,
  RowErrors,
  RunOutcome,
  ValidationErrors,
  WorkEntry,
} from '@/types/timesheet';

import { ConfirmDialog } from './_components/confirm-dialog';
import { FailedWorklogsPanel } from './_components/failed-worklogs-panel';
import { LogworkStep, LogworkStepper } from './_components/logwork-stepper';
import { MissingWorklogsCard } from './_components/missing-worklogs-card';
import { SubmissionModal } from './_components/submission-modal';
import { WorklogProfileTabs } from './_components/worklog-profile-tabs';

const NOT_LOGGED_HINT = 'Retry the rest from "Not logged" below the form.';

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
    submitWork,
    retryFailed,
    cancelSubmission,
    resetResults,
  } = useLogWorkSubmission(settings);

  const {
    profiles,
    activeProfile,
    entries,
    setEntries,
    selectProfile,
    createProfile,
    duplicateProfile,
    renameProfile,
    deleteProfile,
  } = useWorklogProfiles(selectedProjectId);
  const { failedWorklogs, updateFailedWorklogs } =
    useFailedWorklogs(selectedProjectId);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({
    global: {},
    rows: new Map(),
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const pendingResultsRef = useRef<LogWorkResult[]>([]);
  // The rows the current run was started with, to snapshot its leftovers.
  const runEntriesRef = useRef<ReadonlyMap<string, WorkEntry>>(new Map());

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

  // Row errors are keyed by entry id, so they mean nothing on another profile
  // — whether the user switched tabs or the header switched project.
  const [errorsProfileId, setErrorsProfileId] = useState(activeProfile.id);
  if (errorsProfileId !== activeProfile.id) {
    setErrorsProfileId(activeProfile.id);
    setErrors(prev => ({
      ...prev,
      global: { ...prev.global, entries: undefined },
      rows: new Map(),
    }));
  }

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
  }, [setEntries]);

  const removeEntry = useCallback(
    (id: string) => {
      setEntries(prev =>
        prev.length > 1 ? prev.filter(e => e.id !== id) : prev
      );
    },
    [setEntries]
  );

  const updateEntry = useCallback(
    (id: string, field: keyof WorkEntry, value: string | number) => {
      setEntries(prev =>
        prev.map(entry =>
          entry.id === id ? { ...entry, [field]: value } : entry
        )
      );
    },
    [setEntries]
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
        toast.warning(`${successCount} succeeded, ${errorCount} failed`, {
          description: NOT_LOGGED_HINT,
        });
      } else {
        toast.error(`All ${errorCount} entries failed`, {
          description: NOT_LOGGED_HINT,
        });
      }
    },
    [router, hasAuthError]
  );

  // Save leftovers the moment a run finishes — not when the modal closes —
  // so a reload or a closed tab afterwards cannot lose them.
  const recordOutcome = useCallback(
    (outcome: RunOutcome) => {
      pendingResultsRef.current = outcome.results;
      updateFailedWorklogs(prev =>
        reconcileFailedWorklogs(prev, outcome.statuses, runEntriesRef.current)
      );
    },
    [updateFailedWorklogs]
  );

  // Leaving mid-run would drop requests that were never sent.
  useEffect(() => {
    if (!isSubmitting) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isSubmitting]);

  const handleLogWork = useCallback(async () => {
    setShowConfirmDialog(false);
    setSubmissionModalOpen(true);
    runEntriesRef.current = new Map(entries.map(e => [e.id, e]));
    recordOutcome(await submitEntries({ entries, ranges: dateRanges }));
    // Whatever did not log is now in the Not logged list, so the selection has
    // nothing left to offer but a second copy of what did. The rows stay: they
    // are the profile's template, not a one-off draft.
    setSelectedDates([]);
  }, [entries, dateRanges, submitEntries, recordOutcome]);

  const handleRetryFailed = useCallback(async () => {
    recordOutcome(await retryFailed());
  }, [retryFailed, recordOutcome]);

  const handleRetryFailedWorklogs = useCallback(async () => {
    if (failedWorklogs.length === 0) return;
    setSubmissionModalOpen(true);
    runEntriesRef.current = new Map(
      failedWorklogs.map(f => [f.entry.id, f.entry])
    );
    recordOutcome(await submitWork(failedWorklogs));
  }, [failedWorklogs, submitWork, recordOutcome]);

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
                selectedProject
                  ? selectedProject.name
                  : 'Choose a project in the header to get started.'
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
                <WorkEntriesPanel
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
                  tabs={
                    <WorklogProfileTabs
                      profiles={profiles}
                      activeId={activeProfile.id}
                      onSelect={selectProfile}
                      onCreate={createProfile}
                      onDuplicate={duplicateProfile}
                      onRename={renameProfile}
                      onDelete={deleteProfile}
                      disabled={isSubmitting}
                    />
                  }
                />
              </FieldMessage>
            </LogworkStep>
          </LogworkStepper>

          {/* Below the form, so appearing, shrinking or clearing never moves
              the fields above it. */}
          <FailedWorklogsPanel
            failedWorklogs={failedWorklogs}
            onRetry={handleRetryFailedWorklogs}
            onRemove={entryId =>
              updateFailedWorklogs(prev =>
                prev.filter(f => f.entry.id !== entryId)
              )
            }
            onClear={() => updateFailedWorklogs(() => [])}
            retryDisabled={isSubmitting || !isConfigured}
            dismissDisabled={isSubmitting}
          />
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
