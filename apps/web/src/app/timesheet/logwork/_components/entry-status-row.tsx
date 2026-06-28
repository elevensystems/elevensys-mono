'use client';

import { useId, useMemo, useState } from 'react';

import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';

import { Badge } from '@workspace/ui/components/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import type { RequestStatus, RequestStatusState } from '@/types/timesheet';

function StatusIcon({ status }: { status: RequestStatusState }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'in-progress':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-color-4" />;
    case 'success':
      return (
        <CheckCircle2 className="h-3.5 w-3.5 text-color-18 animate-in fade-in-0 zoom-in-75 duration-150" />
      );
    case 'failed':
      return (
        <XCircle className="h-3.5 w-3.5 text-color-6 animate-in fade-in-0 zoom-in-75 duration-150" />
      );
    case 'skipped':
      return <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />;
  }
}

interface EntryMiniBarProps {
  completedPct: number;
  isInProgress: boolean;
  ariaLabel: string;
}

function EntryMiniBar({
  completedPct,
  isInProgress,
  ariaLabel,
}: EntryMiniBarProps) {
  return (
    <div
      className="h-1.5 w-[180px] shrink-0 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={completedPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          'h-full rounded-full bg-color-8 transition-all duration-500 ease-out',
          isInProgress && 'animate-pulse'
        )}
        style={{ width: `${completedPct}%` }}
      />
    </div>
  );
}

interface EntryStatusRowProps {
  issueKey: string;
  dateStatuses: RequestStatus[];
}

export function EntryStatusRow({
  issueKey,
  dateStatuses,
}: EntryStatusRowProps) {
  const detailId = useId();

  const {
    successCount,
    failedCount,
    skippedCount,
    completedCount,
    hasFailure,
    hasStarted,
    allDone,
  } = useMemo(() => {
    let success = 0;
    let failed = 0;
    let skipped = 0;
    let started = false;
    let done = true;
    for (const s of dateStatuses) {
      if (s.status === 'success') success++;
      else if (s.status === 'failed') failed++;
      else if (s.status === 'skipped') skipped++;
      if (s.status !== 'pending') started = true;
      if (
        s.status !== 'success' &&
        s.status !== 'failed' &&
        s.status !== 'skipped'
      )
        done = false;
    }
    return {
      successCount: success,
      failedCount: failed,
      skippedCount: skipped,
      completedCount: success + failed + skipped,
      hasFailure: failed > 0,
      hasStarted: started,
      allDone: done,
    };
  }, [dateStatuses]);

  const isInProgress = hasStarted && !allDone;
  const completedPct =
    dateStatuses.length > 0
      ? Math.round((completedCount / dateStatuses.length) * 100)
      : 0;

  const phase = `${hasFailure}`;
  const [expandOverride, setExpandOverride] = useState<{
    phase: string;
    value: boolean;
  } | null>(null);
  const manualExpanded =
    expandOverride?.phase === phase ? expandOverride.value : null;

  const autoExpanded = hasFailure;
  const expanded = manualExpanded ?? autoExpanded;

  const [filterOverride, setFilterOverride] = useState<{
    phase: string;
    value: boolean;
  } | null>(null);
  const filterDefault = hasFailure;
  const showFailuresOnly =
    filterOverride?.phase === phase ? filterOverride.value : filterDefault;
  const effectiveFailuresOnly = showFailuresOnly && hasFailure;

  const filteredStatuses = effectiveFailuresOnly
    ? dateStatuses.filter(
      s => s.status === 'failed' || s.status === 'skipped'
    )
    : dateStatuses;

  const hasMiniBar = dateStatuses.length > 0;

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setExpandOverride({ phase, value: !expanded })}
        aria-expanded={expanded}
        aria-controls={detailId}
        className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-90'
          )}
        />
        <span className="font-mono font-medium">{issueKey}</span>
        {hasMiniBar && (
          <div className="ml-2">
            <EntryMiniBar
              completedPct={completedPct}
              isInProgress={isInProgress}
              ariaLabel={`${issueKey}: ${completedCount} of ${dateStatuses.length} submitted`}
            />
          </div>
        )}
        {hasStarted && (
          <div className="ml-auto flex items-center gap-1.5">
            {successCount > 0 && (
              <Badge className="gap-1 bg-transparent text-color-18 border-color-18/20">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-color-8" />
                {successCount}
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge className="gap-1 bg-transparent text-color-6 border-color-6/20">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-color-6" />
                {failedCount}
              </Badge>
            )}
            {skippedCount > 0 && (
              <Badge className="gap-1 bg-transparent text-muted-foreground border-muted-foreground/20">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                {skippedCount}
              </Badge>
            )}
          </div>
        )}
      </button>

      <div
        id={detailId}
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-[500px]' : 'max-h-0'
        )}
      >
        <div className="border-t bg-muted/30">
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
            <div
              role="radiogroup"
              aria-label="Filter ranges"
              className="inline-flex rounded-md border bg-background p-0.5"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!effectiveFailuresOnly}
                onClick={() => setFilterOverride({ phase, value: false })}
                className={cn(
                  'rounded-sm px-2 py-0.5 text-xs transition-colors',
                  !effectiveFailuresOnly
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={effectiveFailuresOnly}
                onClick={() => setFilterOverride({ phase, value: true })}
                disabled={!hasFailure}
                className={cn(
                  'rounded-sm px-2 py-0.5 text-xs transition-colors',
                  effectiveFailuresOnly
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                  !hasFailure && 'opacity-50 cursor-not-allowed hover:text-muted-foreground'
                )}
              >
                Failures
              </button>
            </div>
            <span className="text-muted-foreground tabular-nums">
              {dateStatuses.length} {dateStatuses.length !== 1 ? 'ranges' : 'range'} · {failedCount} failed ·{' '}
              {skippedCount} skipped
            </span>
          </div>
          <div className="px-3 pb-1.5">
            {filteredStatuses.map((ds, i) => (
              <div
                key={`${ds.rangeLabel}-${i}`}
                className="flex items-center gap-2.5 py-1 pl-7 text-xs"
              >
                <StatusIcon status={ds.status} />
                <span className="font-mono text-muted-foreground">
                  {ds.rangeLabel}
                  {ds.dates.length > 1 && (
                    <span className="ml-1 text-muted-foreground/60">
                      ({ds.dates.length} days)
                    </span>
                  )}
                </span>
                {ds.status === 'failed' && ds.error && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-1 cursor-help text-color-6 underline decoration-dotted">
                        error
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-[300px] text-xs"
                    >
                      {ds.error.length > 200
                        ? `${ds.error.slice(0, 200)}...`
                        : ds.error}
                    </TooltipContent>
                  </Tooltip>
                )}
                {ds.status === 'skipped' && (
                  <span className="text-muted-foreground/60">skipped</span>
                )}
              </div>
            ))}
            {filteredStatuses.length === 0 && (
              <div className="py-2 pl-7 text-xs text-muted-foreground italic">
                No matching ranges.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
