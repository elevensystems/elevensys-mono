'use client';

import { CheckCheckIcon, LayoutList } from 'lucide-react';

import { ActionButton } from '@workspace/ui/components/action-button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet';
import { cn } from '@workspace/ui/lib/utils';
import {
  formatHours,
  getWorkTypeBadgeClass,
  getWorkTypeDotClass,
  parseApiDate,
} from '@/lib/timesheet';
import type { DateRange, JiraProject, WorkEntry } from '@/types/timesheet';
import { WORK_TYPES } from '@/types/timesheet';

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatRangeShort(range: DateRange): string {
  const start = parseApiDate(range.startDate);
  if (range.startDate === range.endDate) {
    return start ? formatShortDate(start) : range.startDate;
  }
  const end = parseApiDate(range.endDate);
  const startLabel = start ? formatShortDate(start) : range.startDate;
  const endLabel = end ? formatShortDate(end) : range.endDate;
  return `${startLabel} → ${endLabel}`;
}

function formatDaysSummary(parsedDates: string[], dateRanges: DateRange[]): string {
  const dayLabel = `${parsedDates.length} day${parsedDates.length !== 1 ? 's' : ''}`;
  if (parsedDates.length === 1) {
    const d = parseApiDate(parsedDates[0]);
    return d ? `${dayLabel} · ${formatShortDate(d)}` : dayLabel;
  }
  if (dateRanges.length === 1) {
    return `${dayLabel} · ${formatRangeShort(dateRanges[0])}`;
  }
  return `${dayLabel} across ${dateRanges.length} ranges`;
}

function formatGroupHeader(range: DateRange): string {
  const start = parseApiDate(range.startDate);
  if (range.startDate === range.endDate) {
    return (start ? formatLongDate(start) : range.startDate).toUpperCase();
  }
  const end = parseApiDate(range.endDate);
  const startLabel = start ? formatShortDate(start) : range.startDate;
  const endLabel = end ? formatLongDate(end) : range.endDate;
  return `${startLabel} → ${endLabel}`.toUpperCase();
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  entries: WorkEntry[];
  parsedDates: string[];
  dateRanges: DateRange[];
  selectedProject?: JiraProject;
  totalHours: number;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  entries,
  parsedDates,
  dateRanges,
  selectedProject,
  totalHours,
}: ConfirmDialogProps) {
  const validEntries = entries.filter(e => e.issueKey.trim());
  const totalWorklogs = validEntries.length * parsedDates.length;
  const totalHoursAll = totalHours * parsedDates.length;
  const totalRequests = validEntries.length * dateRanges.length;

  const typeHoursByDay = new Map<string, number>();
  for (const entry of validEntries) {
    typeHoursByDay.set(
      entry.typeOfWork,
      (typeHoursByDay.get(entry.typeOfWork) ?? 0) + entry.hours
    );
  }
  const typeBreakdown = WORK_TYPES.map(type => ({
    type,
    hours: (typeHoursByDay.get(type) ?? 0) * parsedDates.length,
  })).filter(item => item.hours > 0);

  const firstDate = parsedDates[0] ? parseApiDate(parsedDates[0]) : null;
  const year = firstDate?.getFullYear();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 sm:max-w-md"
        hideCloseButton
      >
        {/* Fixed header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle>Confirm Submission</SheetTitle>
          <SheetDescription>
            Review the worklogs that will be created before confirming.
          </SheetDescription>

          {/* Summary Banner */}
          <div className="mt-2 rounded-lg border overflow-hidden">
            <div className="grid grid-cols-2 divide-x">
              <div className="flex flex-col gap-0.5 px-4 py-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tabular-nums leading-none">
                    {totalWorklogs}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    worklog{totalWorklogs !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  across {totalRequests} request{totalRequests !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 px-4 py-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tabular-nums leading-none">
                    {formatHours(totalHoursAll)}
                  </span>
                  <span className="text-sm text-muted-foreground">h</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDaysSummary(parsedDates, dateRanges)}
                </span>
              </div>
            </div>

            {typeBreakdown.length > 0 && (
              <div className="border-t px-4 py-3 space-y-2.5">
                <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
                  {typeBreakdown.map(({ type, hours }) => (
                    <div
                      key={type}
                      className={cn('h-full rounded-full', getWorkTypeDotClass(type))}
                      style={{
                        width: `${(hours / totalHoursAll) * 100}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {typeBreakdown.map(({ type, hours }) => (
                    <span key={type} className="inline-flex items-center gap-1.5 text-xs">
                      <span
                        className={cn(
                          'size-2 shrink-0 rounded-full',
                          getWorkTypeDotClass(type)
                        )}
                      />
                      <span className="font-semibold">{type}</span>
                      <span className="text-muted-foreground">{formatHours(hours)}h</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedProject && (
            <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                <LayoutList className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold leading-tight truncate">
                  {selectedProject.key}
                </p>
                <p className="font-mono text-xs text-muted-foreground leading-tight truncate">
                  {selectedProject.name}
                  {year !== undefined && ` · ${year}`}
                </p>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Scrollable date-grouped list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 px-6 py-4">
            {dateRanges.map(range => {
              const hoursForRange = totalHours * range.dates.length;

              return (
                <div key={range.startDate}>
                  <div className="flex items-center justify-between px-1 pb-2">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground">
                      {formatGroupHeader(range)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {validEntries.length} entr{validEntries.length !== 1 ? 'ies' : 'y'} ·{' '}
                      {formatHours(hoursForRange)}h
                    </p>
                  </div>

                  <div className="divide-y rounded-md border overflow-hidden">
                    {validEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="relative flex items-start justify-between gap-3 bg-background py-2.5 pl-4 pr-3"
                      >
                        <span
                          className={cn(
                            'absolute left-1.5 top-2 bottom-2 w-1 rounded-full',
                            getWorkTypeDotClass(entry.typeOfWork)
                          )}
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">
                              {entry.issueKey}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                getWorkTypeBadgeClass(entry.typeOfWork)
                              )}
                            >
                              {entry.typeOfWork}
                            </span>
                          </div>
                          {entry.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {entry.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums">
                            {formatHours(entry.hours)}h
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ×{range.dates.length}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Fixed footer */}
        <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row justify-start gap-2">
          <ActionButton onClick={onConfirm} leftIcon={<CheckCheckIcon />}>
            Confirm &amp; Submit
          </ActionButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
