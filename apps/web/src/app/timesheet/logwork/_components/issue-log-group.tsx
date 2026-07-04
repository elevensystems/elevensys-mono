'use client';

import { Shimmer } from '@workspace/ui/components/shimmer';
import { cn } from '@workspace/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  CheckCircle2,
  CircleDashed,
  CircleMinus,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';

import type { RequestStatus } from '@/types/timesheet';

import {
  type IssueState,
  classifyIssueState,
  formatIssueSummary,
  splitErrorMessage,
} from './submission-log-utils';

const ISSUE_ICON_CONFIG: Record<
  IssueState,
  { icon: LucideIcon; className: string }
> = {
  failed: { icon: XCircle, className: 'text-color-6' },
  'in-progress': {
    icon: CircleDashed,
    className: 'text-color-4',
  },
  pending: { icon: Clock, className: 'text-muted-foreground' },
  skipped: {
    icon: CircleMinus,
    className: 'text-muted-foreground',
  },
  success: { icon: CheckCircle2, className: 'text-color-18' },
};

function RangeRow({ status }: { status: RequestStatus }) {
  switch (status.status) {
    case 'success':
      return (
        <div className="flex items-center gap-2.5 px-3 py-2 text-sm">
          <Check className="size-4 shrink-0 text-color-18" />
          <span className="font-mono text-muted-foreground">
            {status.rangeLabel}
          </span>
        </div>
      );
    case 'in-progress':
      return (
        <div className="flex items-center justify-between gap-2.5 px-3 py-2 text-sm">
          <div className="flex items-center gap-2.5">
            <Loader2 className="size-4 shrink-0 animate-spin text-color-4" />
            <span className="font-mono text-muted-foreground">
              {status.rangeLabel}
            </span>
          </div>
          <Shimmer className="text-color-4">Submitting...</Shimmer>
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center justify-between gap-2.5 px-3 py-2 text-sm">
          <div className="flex items-center gap-2.5">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-mono text-muted-foreground">
              {status.rangeLabel}
            </span>
          </div>
          <span className="text-muted-foreground">Queued</span>
        </div>
      );
    case 'failed': {
      const { label, message } = splitErrorMessage(
        status.error,
        status.errorStatus
      );
      return (
        <div className="flex items-center justify-between gap-2.5 px-3 py-2 text-sm bg-color-6/8 dark:bg-color-6/10">
          <div className="flex items-center gap-2.5">
            <XCircle className="size-4 shrink-0 text-color-6" />
            <span className="font-mono text-muted-foreground">
              {status.rangeLabel}
            </span>
          </div>
          <span className="text-color-6 text-right">
            {label} · {message}
          </span>
        </div>
      );
    }
    case 'skipped':
      return (
        <div className="flex items-center justify-between gap-2.5 px-3 py-2 text-sm">
          <div className="flex items-center gap-2.5">
            <CircleMinus className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-mono text-muted-foreground">
              {status.rangeLabel}
            </span>
          </div>
          <span className="text-muted-foreground">
            Skipped after prior failure
          </span>
        </div>
      );
  }
}

interface IssueLogGroupProps {
  issueKey: string;
  dateStatuses: RequestStatus[];
  isLast: boolean;
}

export function IssueLogGroup({
  issueKey,
  dateStatuses,
  isLast,
}: IssueLogGroupProps) {
  const state = classifyIssueState(dateStatuses);
  const { icon: Icon, className } = ISSUE_ICON_CONFIG[state];
  const summary = formatIssueSummary(dateStatuses);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full bg-background',
            className
          )}
        >
          <Icon className="size-4" />
        </span>
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>
      <div className="flex-1 pb-5">
        <p className="mb-2 text-sm">
          <span className="font-mono font-medium">{issueKey}</span>
          <span className="text-muted-foreground">
            {' '}
            · {dateStatuses.length} range{dateStatuses.length !== 1 ? 's' : ''}{' '}
            · {summary}
          </span>
        </p>
        <div className="divide-y rounded-lg border">
          {dateStatuses.map((ds, i) => (
            <RangeRow key={`${ds.rangeLabel}-${i}`} status={ds} />
          ))}
        </div>
      </div>
    </div>
  );
}
