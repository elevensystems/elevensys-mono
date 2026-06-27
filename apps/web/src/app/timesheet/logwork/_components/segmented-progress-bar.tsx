'use client';

import { useMemo } from 'react';

import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';
import type { RequestStatus } from '@/types/timesheet';

interface SegmentedProgressBarProps {
  statuses: RequestStatus[];
  className?: string;
}

export function SegmentedProgressBar({
  statuses,
  className,
}: SegmentedProgressBarProps) {
  const { completedCount, successCount, failedCount, skippedCount, isInProgress } =
    useMemo(() => {
      let success = 0;
      let failed = 0;
      let skipped = 0;
      let started = false;
      let done = true;
      for (const s of statuses) {
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
        completedCount: success + failed + skipped,
        successCount: success,
        failedCount: failed,
        skippedCount: skipped,
        isInProgress: started && !done,
      };
    }, [statuses]);

  const total = statuses.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full bg-color-8 transition-all duration-500 ease-out',
            isInProgress && 'animate-pulse'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {completedCount}/{total} requests
        </span>
        <div className="flex items-center gap-1.5">
          <Badge className="gap-1 bg-transparent text-color-18 border-color-18/20">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-color-8" />
            {successCount}
          </Badge>
          {failedCount > 0 && (
            <Badge className="gap-1 bg-transparent text-color-6 border-color-6/20">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-color-20" />
              {failedCount}
            </Badge>
          )}
          {skippedCount > 0 && (
            <Badge className="gap-1 bg-transparent text-muted-foreground border-muted-foreground/20">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-color-16" />
              {skippedCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
