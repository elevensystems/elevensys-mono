'use client';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import {
  Panel,
  PanelActions,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from '@workspace/ui/components/panel';
import { Token } from '@workspace/ui/components/token';
import { RotateCw, X } from 'lucide-react';

import { formatHours, formatRangeLabel } from '@/lib/timesheet';
import type { FailedWorklog } from '@/types/timesheet';

interface FailedWorklogsPanelProps {
  failedWorklogs: FailedWorklog[];
  onRetry: () => void;
  onRemove: (entryId: string) => void;
  onClear: () => void;
  retryDisabled?: boolean;
  /**
   * Disables dismissing while a run is in flight — its outcome is folded back
   * into this list when it ends, which would restore what was dismissed.
   */
  dismissDisabled?: boolean;
}

/** What the confirm dialog would dismiss: one item or the whole list. */
type DismissTarget = FailedWorklog | 'all';

/**
 * Worklogs from earlier runs that were not confirmed as logged, each with the
 * exact date ranges still missing. Retrying sends only those, so dates that
 * already succeeded are never logged twice.
 */
export function FailedWorklogsPanel({
  failedWorklogs,
  onRetry,
  onRemove,
  onClear,
  retryDisabled = false,
  dismissDisabled = false,
}: FailedWorklogsPanelProps) {
  // The target outlives `dismissOpen` so the dialog keeps its text while it
  // animates closed.
  const [dismissTarget, setDismissTarget] = useState<DismissTarget>('all');
  const [dismissOpen, setDismissOpen] = useState(false);
  const confirmDismiss = (target: DismissTarget) => {
    setDismissTarget(target);
    setDismissOpen(true);
  };

  if (failedWorklogs.length === 0) return null;

  const requestCount = failedWorklogs.reduce(
    (sum, f) => sum + f.ranges.length,
    0
  );

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Not logged</PanelTitle>
        <Token color="orange" density="compact" className="tabular-nums">
          {failedWorklogs.length}
        </Token>
        <span className="text-muted-foreground text-sm">
          Retry these rather than submitting again, so dates that already worked
          are not logged twice.
        </span>
        <PanelActions>
          <Button
            variant="ghost"
            onClick={() => confirmDismiss('all')}
            disabled={dismissDisabled}
          >
            Dismiss all
          </Button>
          <Button
            onClick={onRetry}
            disabled={retryDisabled}
            title={`Will send ${requestCount} request${requestCount !== 1 ? 's' : ''}`}
          >
            <RotateCw />
            Retry
          </Button>
        </PanelActions>
      </PanelHeader>

      <PanelBody>
        <ul className="divide-y">
          {failedWorklogs.map(item => {
            const { entry, ranges, error } = item;
            return (
              <li
                key={entry.id}
                className="flex items-start gap-3 px-4 py-2.5 text-sm"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 font-medium">
                      {entry.issueKey}
                    </span>
                    <span className="text-muted-foreground truncate">
                      {entry.description}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs tabular-nums">
                    {entry.typeOfWork} · {formatHours(entry.hours)}h ·{' '}
                    {ranges.map(formatRangeLabel).join(', ')}
                  </div>
                  {error && (
                    <div
                      className="text-destructive line-clamp-2 text-xs"
                      title={error}
                    >
                      {error}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => confirmDismiss(item)}
                  disabled={dismissDisabled}
                  aria-label={`Dismiss ${entry.issueKey}`}
                  title="Dismiss"
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      </PanelBody>

      <AlertDialog open={dismissOpen} onOpenChange={setDismissOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dismissTarget === 'all' ? 'Dismiss all' : 'Dismiss worklog'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dismissTarget === 'all' ? (
                <>
                  Forget {failedWorklogs.length} worklog
                  {failedWorklogs.length !== 1 ? 's' : ''} that did not get
                  logged? Nothing is sent to Jira, and they will no longer be
                  offered for retry.
                </>
              ) : (
                <>
                  Forget {dismissTarget.entry.issueKey} for{' '}
                  {dismissTarget.ranges.map(formatRangeLabel).join(', ')}?
                  Nothing is sent to Jira, and those dates will no longer be
                  offered for retry.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (dismissTarget === 'all') onClear();
                else onRemove(dismissTarget.entry.id);
              }}
            >
              {dismissTarget === 'all' ? 'Dismiss all' : 'Dismiss'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}
