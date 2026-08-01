'use client';

import { useCallback, useMemo, useState } from 'react';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@workspace/ui/components/dialog';
import { cn } from '@workspace/ui/lib/utils';
import { RefreshCw, X } from 'lucide-react';

import type { LogWorkResult, RequestStatus } from '@/types/timesheet';

import { CancelConfirmDialog } from './cancel-confirm-dialog';
import { IssueLogGroup } from './issue-log-group';
import {
  type OverallStatus,
  classifyOverallStatus,
  getStatusCounts,
  groupStatusesByEntry,
} from './submission-log-utils';
import { SubmissionStatusHeader } from './submission-status-header';

interface SubmissionModalProps {
  open: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  isCancelled: boolean;
  requestStatuses: RequestStatus[];
  results: LogWorkResult[];
  onCancel: () => void;
  onRetryFailed: () => void;
}

const PROGRESS_FILL_CLASSES: Record<OverallStatus, string> = {
  'in-progress': 'bg-info',
  complete: 'bg-success',
  partial: 'bg-warning',
  failed: 'bg-destructive',
};

export function SubmissionModal({
  open,
  onClose,
  isSubmitting,
  requestStatuses,
  results,
  onCancel,
  onRetryFailed,
}: SubmissionModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const counts = useMemo(
    () => getStatusCounts(requestStatuses),
    [requestStatuses]
  );

  const status = useMemo(
    () =>
      classifyOverallStatus(
        isSubmitting,
        counts.successCount,
        counts.failedCount,
        counts.skippedCount
      ),
    [isSubmitting, counts.successCount, counts.failedCount, counts.skippedCount]
  );

  const entryGroups = useMemo(
    () => groupStatusesByEntry(requestStatuses),
    [requestStatuses]
  );

  const progressPct =
    counts.totalRanges > 0
      ? Math.round((counts.completedCount / counts.totalRanges) * 100)
      : 0;

  const isDone = !isSubmitting && requestStatuses.length > 0;

  const handleCancelClick = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleCloseButtonClick = useCallback(() => {
    if (isSubmitting) {
      handleCancelClick();
    } else {
      onClose();
    }
  }, [isSubmitting, handleCancelClick, onClose]);

  const hasFailedResults = results.some(
    r => !r.success && r.error !== 'Cancelled'
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={isOpen => {
          if (!isOpen && isSubmitting) {
            // Pressing ESC/outside-click during submission triggers cancel
            handleCancelClick();
            return;
          }
          if (!isOpen && !isSubmitting) {
            onClose();
          }
        }}
      >
        <DialogContent
          className="sm:max-w-3xl"
          showCloseButton={false}
          onPointerDownOutside={e => {
            if (isSubmitting) e.preventDefault();
          }}
          onEscapeKeyDown={e => {
            if (isSubmitting) {
              e.preventDefault();
              handleCancelClick();
            }
          }}
        >
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <SubmissionStatusHeader status={status} counts={counts} />
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Close"
                onClick={handleCloseButtonClick}
              >
                <X className="size-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  PROGRESS_FILL_CLASSES[status]
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {isSubmitting
                  ? `${counts.completedCount} of ${counts.totalRanges} ranges`
                  : `${counts.totalRanges} ranges`}
              </span>
              <span>{counts.issueCount} issues</span>
            </div>

            <div className="max-h-[420px] overflow-y-auto pr-1">
              {entryGroups.map(({ entryId, issueKey, dateStatuses }, index) => (
                <IssueLogGroup
                  key={entryId}
                  issueKey={issueKey}
                  dateStatuses={dateStatuses}
                  isLast={index === entryGroups.length - 1}
                />
              ))}
            </div>

            {isDone && (
              <DialogFooter className="border-t pt-3 gap-2">
                {hasFailedResults && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={onRetryFailed}
                    className="gap-1.5"
                  >
                    <RefreshCw />
                    Retry Failed
                  </Button>
                )}
                <Button size="default" onClick={onClose}>
                  Close
                </Button>
              </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CancelConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmCancel={handleConfirmCancel}
        successCount={counts.successCount}
      />
    </>
  );
}
