'use client';

import {
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Shimmer } from '@workspace/ui/components/shimmer';
import { cn } from '@workspace/ui/lib/utils';
import { CalendarCheck2, CircleMinus, Loader2, XCircle } from 'lucide-react';

import type { OverallStatus, StatusCounts } from './submission-log-utils';

interface SubmissionStatusHeaderProps {
  status: OverallStatus;
  counts: StatusCounts;
}

const STATE_CONFIG: Record<
  OverallStatus,
  { icon: typeof Loader2; avatarClasses: string; title: string }
> = {
  'in-progress': {
    icon: Loader2,
    avatarClasses: 'bg-info/10 text-info',
    title: 'Submitting worklogs...',
  },
  complete: {
    icon: CalendarCheck2,
    avatarClasses: 'bg-success/10 text-success',
    title: 'Submission complete',
  },
  partial: {
    icon: CircleMinus,
    avatarClasses: 'bg-warning/10 text-warning',
    title: 'Submission partial',
  },
  failed: {
    icon: XCircle,
    avatarClasses: 'bg-destructive/10 text-destructive',
    title: 'Submission failed',
  },
};

function getSubtitle(status: OverallStatus, counts: StatusCounts): string {
  const {
    successCount,
    failedCount,
    skippedCount,
    completedCount,
    totalRanges,
  } = counts;

  if (status === 'in-progress') {
    return `${completedCount} of ${totalRanges} ranges processed`;
  }
  if (status === 'complete') {
    return `All ${successCount} worklog${successCount !== 1 ? 's' : ''} submitted successfully`;
  }
  if (failedCount > 0 && successCount === 0 && skippedCount === 0) {
    return `All ${failedCount} worklog${failedCount !== 1 ? 's' : ''} failed`;
  }

  const parts: string[] = [
    `${successCount} succeeded`,
    `${failedCount} failed`,
  ];
  if (skippedCount > 0) parts.push(`${skippedCount} skipped`);
  return parts.join(', ');
}

export function SubmissionStatusHeader({
  status,
  counts,
}: SubmissionStatusHeaderProps) {
  const { icon: Icon, avatarClasses, title } = STATE_CONFIG[status];
  const isInProgress = status === 'in-progress';

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg',
          avatarClasses
        )}
      >
        <Icon className={cn('size-5', isInProgress && 'animate-spin')} />
      </span>
      <div className="min-w-0">
        <Shimmer asChild active={isInProgress}>
          <DialogTitle className="text-base leading-tight font-semibold">
            {title}
          </DialogTitle>
        </Shimmer>
        <DialogDescription className="leading-tight">
          {getSubtitle(status, counts)}
        </DialogDescription>
      </div>
    </div>
  );
}
