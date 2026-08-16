'use client';

import { useState } from 'react';

import { Button } from '@workspace/ui/components/button';
import { ButtonGroup } from '@workspace/ui/components/button-group';
import { Calendar } from '@workspace/ui/components/calendar';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { FieldMessage } from '@workspace/ui/components/field-message';
import { Frame, FrameHeader, FramePanel } from '@workspace/ui/components/frame';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import { Spinner } from '@workspace/ui/components/spinner';
import { Token } from '@workspace/ui/components/token';
import { cn } from '@workspace/ui/lib/utils';
import { CalendarPlus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { parseApiDate } from '@/lib/timesheet';

import { DateChipList } from './date-chip-list';

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

interface MissingWorklogsCardProps {
  /** App-wide project scope, owned by the header switcher. */
  selectedProjectId: string;
  warningFromDate: string;
  warningToDate: string;
  onWarningFromDateChange: (date: string) => void;
  onWarningToDateChange: (date: string) => void;
  isSearchingWarnings: boolean;
  onSearchWarnings: () => Promise<{ dates: string; count: number } | null>;
  selectedDates: Date[];
  onSelectedDatesChange: (dates: Date[]) => void;
  parsedDates: string[];
  onClearAllDates: () => void;
  includeWeekends: boolean;
  onIncludeWeekendsChange: (value: boolean) => void;
  dateError?: string;
}

export function MissingWorklogsCard({
  selectedProjectId,
  warningFromDate,
  warningToDate,
  onWarningFromDateChange,
  onWarningToDateChange,
  isSearchingWarnings,
  onSearchWarnings,
  selectedDates,
  onSelectedDatesChange,
  parsedDates,
  onClearAllDates,
  includeWeekends,
  onIncludeWeekendsChange,
  dateError,
}: MissingWorklogsCardProps) {
  const [manualDateKeys, setManualDateKeys] = useState<Set<string>>(new Set());

  const handleRemoveDate = (date: Date) => {
    onSelectedDatesChange(
      selectedDates.filter(d => d.getTime() !== date.getTime())
    );
    setManualDateKeys(prev => {
      const next = new Set(prev);
      next.delete(toDateKey(date));
      return next;
    });
  };

  const handleClearAll = () => {
    onClearAllDates();
    setManualDateKeys(new Set());
  };

  const handleCalendarSelect = (newDates: Date[] | undefined) => {
    const next = newDates ?? [];
    const prevKeys = new Set(selectedDates.map(toDateKey));
    const addedKeys = next
      .filter(d => !prevKeys.has(toDateKey(d)))
      .map(toDateKey);
    const removedKeys = selectedDates
      .filter(d => !next.some(n => n.getTime() === d.getTime()))
      .map(toDateKey);
    setManualDateKeys(prev => {
      const updated = new Set(prev);
      addedKeys.forEach(k => updated.add(k));
      removedKeys.forEach(k => updated.delete(k));
      return updated;
    });
    onSelectedDatesChange(next);
  };

  const handleSearchClick = async () => {
    const result = await onSearchWarnings();
    if (result === null) return;

    const dates = result.dates
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(parseApiDate)
      .filter((d): d is Date => {
        if (d === null) return false;
        if (!includeWeekends && isWeekend(d)) return false;
        return true;
      });
    onSelectedDatesChange(dates);
    setManualDateKeys(new Set());
    if (dates.length > 0) {
      toast.success(
        `Found ${dates.length} missing date${dates.length !== 1 ? 's' : ''}`
      );
    } else {
      toast.info('No missing dates found.');
    }
  };

  return (
    /* The frame is the validated control: the error ring stays on it
       and the message sits in the tinted strip below. */
    <FieldMessage
      state="error"
      message={dateError}
      className="rounded-xl"
      controlClassName="rounded-xl border-0 bg-background"
      showIcon
    >
      <Frame dense className={cn(dateError && 'border-destructive')}>
        <FrameHeader className="gap-3">
          {/* The project comes from the header switcher, so the range picker
              and its two fill actions are all this row carries. */}
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <DateRangePicker
                id="warning-date-range"
                from={warningFromDate}
                to={warningToDate}
                onRangeChange={(from, to) => {
                  onWarningFromDateChange(from);
                  onWarningToDateChange(to);
                }}
                className="w-full sm:w-64"
              />
              {/* Find Dates and Add manually are two ways to fill the same
                  list of selected dates, so they share one group */}
              <ButtonGroup className="w-full sm:ml-auto sm:w-fit">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 sm:flex-none">
                      <CalendarPlus />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="end"
                    sideOffset={8}
                  >
                    <div className="p-3 border-b">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                        <Checkbox
                          checked={includeWeekends}
                          onCheckedChange={checked =>
                            onIncludeWeekendsChange(checked === true)
                          }
                        />
                        Include weekends
                      </label>
                    </div>
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={handleCalendarSelect}
                      disabled={includeWeekends ? undefined : isWeekend}
                      numberOfMonths={3}
                      showOutsideDays={false}
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={handleSearchClick}
                  disabled={
                    isSearchingWarnings ||
                    !selectedProjectId ||
                    !warningFromDate ||
                    !warningToDate
                  }
                  className="flex-1 sm:flex-none"
                  title={
                    !selectedProjectId
                      ? 'Choose a project in the header first'
                      : undefined
                  }
                >
                  {isSearchingWarnings ? <Spinner /> : <Search />}
                  {isSearchingWarnings ? 'Searching' : 'Find Dates'}
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </FrameHeader>

        {/* Selected dates — flush inside the frame, keeping its radius.
              Clear all sits in the panel's own toolbar, directly above the
              chips it acts on, rather than floating between the two blocks. */}
        <FramePanel rounded className="gap-0 overflow-hidden p-0">
          <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">
                Selected dates
              </span>
              {parsedDates.length > 0 && (
                <Token color="default" density="compact">
                  {parsedDates.length} date
                  {parsedDates.length !== 1 ? 's' : ''}
                </Token>
              )}
            </div>

            {/* Clear all — only offered when there is something to clear */}
            {parsedDates.length > 0 && (
              <Button variant="destructive" size="xs" onClick={handleClearAll}>
                <Trash2 />
                Clear all
              </Button>
            )}
          </div>

          {/* DateChipList reserves one chip row's height when empty */}
          <div className="p-3">
            <DateChipList
              dates={selectedDates}
              manualDateKeys={manualDateKeys}
              onRemove={handleRemoveDate}
            />
          </div>
        </FramePanel>
      </Frame>
    </FieldMessage>
  );
}
