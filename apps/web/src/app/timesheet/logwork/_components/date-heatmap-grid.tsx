'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import type { RequestStatus, RequestStatusState } from '@/types/timesheet';

const CELL_COLORS: Record<RequestStatusState, string> = {
  pending: 'bg-muted-foreground/20',
  'in-progress': 'bg-blue-500 animate-pulse',
  success: 'bg-green-500',
  failed: 'bg-red-500',
  skipped: 'bg-muted-foreground/10',
};

const STATUS_LABELS: Record<RequestStatusState, string> = {
  pending: 'Pending',
  'in-progress': 'In progress',
  success: 'Success',
  failed: 'Failed',
  skipped: 'Skipped',
};

interface DateHeatmapGridProps {
  dateStatuses: RequestStatus[];
  cols?: number;
}

export function DateHeatmapGrid({
  dateStatuses,
  cols = 7,
}: DateHeatmapGridProps) {
  if (dateStatuses.length === 0) return null;

  return (
    <div
      className="grid gap-px"
      style={{ gridTemplateColumns: `repeat(${cols}, 6px)` }}
    >
      {dateStatuses.map((ds, i) => (
        <Tooltip key={`${ds.date}-${i}`}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'size-1.5 rounded-[1px] cursor-default transition-colors duration-300',
                CELL_COLORS[ds.status]
              )}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <span className="font-mono">{ds.date}</span>
            <span className="ml-1.5 text-muted-foreground">
              · {STATUS_LABELS[ds.status]}
            </span>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
