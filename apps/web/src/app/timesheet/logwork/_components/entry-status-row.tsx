'use client';

import { useState } from 'react';

import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import type { RequestStatus, RequestStatusState } from '@/types/timesheet';

const STATUS_DOT_COLORS: Record<RequestStatusState, string> = {
  pending: 'bg-muted-foreground/30',
  'in-progress': 'bg-blue-500 animate-pulse',
  success: 'bg-green-500',
  failed: 'bg-red-500',
  skipped: 'bg-muted-foreground/20',
};

function StatusIcon({ status }: { status: RequestStatusState }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'in-progress':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />;
    case 'success':
      return (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 animate-in fade-in-0 zoom-in-75 duration-150" />
      );
    case 'failed':
      return (
        <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 animate-in fade-in-0 zoom-in-75 duration-150" />
      );
    case 'skipped':
      return <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />;
  }
}

interface EntryStatusRowProps {
  issueKey: string;
  dateStatuses: RequestStatus[];
}

export function EntryStatusRow({
  issueKey,
  dateStatuses,
}: EntryStatusRowProps) {
  // Encode phase into override so it auto-invalidates on phase transitions
  const [expandOverride, setExpandOverride] = useState<{
    phase: string;
    value: boolean;
  } | null>(null);

  const hasStarted = dateStatuses.some(s => s.status !== 'pending');
  const allDone = dateStatuses.every(
    s =>
      s.status === 'success' || s.status === 'failed' || s.status === 'skipped'
  );

  const completedCount = dateStatuses.filter(
    s =>
      s.status === 'success' || s.status === 'failed' || s.status === 'skipped'
  ).length;

  const phase = `${hasStarted}-${allDone}`;
  const manualExpanded =
    expandOverride?.phase === phase ? expandOverride.value : null;

  // Auto-expand while processing (started but not all done), collapse when complete
  const autoExpanded = hasStarted && !allDone;
  const expanded = manualExpanded ?? autoExpanded;

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setExpandOverride({ phase, value: !expanded })}
        className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-90'
          )}
        />
        <span className="font-mono font-medium">{issueKey}</span>
        <div className="flex items-center gap-0.5 ml-2">
          {dateStatuses.map((ds, i) => (
            <span
              key={`${ds.date}-${i}`}
              className={cn(
                'inline-block size-2 rounded-full transition-colors duration-300',
                STATUS_DOT_COLORS[ds.status]
              )}
            />
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          ({completedCount}/{dateStatuses.length})
        </span>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-[500px]' : 'max-h-0'
        )}
      >
        <div className="border-t bg-muted/30 px-3 py-1.5">
          {dateStatuses.map((ds, i) => (
            <div
              key={`${ds.date}-${i}`}
              className="flex items-center gap-2.5 py-1 pl-7 text-xs"
            >
              <StatusIcon status={ds.status} />
              <span className="font-mono text-muted-foreground">{ds.date}</span>
              {ds.status === 'failed' && ds.error && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 cursor-help text-red-600 dark:text-red-400 underline decoration-dotted">
                      error
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[300px] text-xs">
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
        </div>
      </div>
    </div>
  );
}
