'use client';

import * as React from 'react';

import { Button } from '@workspace/ui/components/button';
import { Calendar } from '@workspace/ui/components/calendar';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import { cn } from '@workspace/ui/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { type DateRange } from 'react-day-picker';

interface DateTimeRangePickerProps {
  from: Date;
  to: Date;
  /** Called with the combined date+time whenever the range or either time changes */
  onRangeChange: (from: Date, to: Date) => void;
  id?: string;
  className?: string;
  /** Earliest selectable date; dates before it are disabled (e.g. log retention window). */
  minDate?: Date;
}

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 8);
}

function withTime(target: Date, timeSource: Date) {
  const next = new Date(target);
  next.setHours(
    timeSource.getHours(),
    timeSource.getMinutes(),
    timeSource.getSeconds()
  );
  return next;
}

function withTimeString(target: Date, timeStr: string) {
  const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(':').map(Number);
  const next = new Date(target);
  next.setHours(hours, minutes, seconds);
  return next;
}

function DateTimeRangePicker({
  from,
  to,
  onRangeChange,
  id,
  className,
  minDate,
}: DateTimeRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected: DateRange = React.useMemo(() => ({ from, to }), [from, to]);

  const handleSelect = React.useCallback(
    (range: DateRange | undefined) => {
      if (!range?.from) return;
      const nextFrom = withTime(range.from, from);
      const nextTo = range.to ? withTime(range.to, to) : nextFrom;
      onRangeChange(nextFrom, nextTo);
    },
    [from, to, onRangeChange]
  );

  const handleStartTimeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) return;
      onRangeChange(withTimeString(from, e.target.value), to);
    },
    [from, to, onRangeChange]
  );

  const handleEndTimeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) return;
      onRangeChange(from, withTimeString(to, e.target.value));
    },
    [from, to, onRangeChange]
  );

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(from, 'LLL dd, y p')} – {format(to, 'LLL dd, y p')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col gap-4 p-3">
            <Calendar
              mode="range"
              defaultMonth={from}
              selected={selected}
              onSelect={handleSelect}
              captionLayout="dropdown"
              disabled={minDate ? { before: minDate } : undefined}
            />
            <div className="flex gap-4 border-t px-1 pt-3">
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor={id ? `${id}-start-time` : undefined}>
                  Start Time
                </Label>
                <Input
                  type="time"
                  id={id ? `${id}-start-time` : undefined}
                  step="1"
                  value={formatTime(from)}
                  onChange={handleStartTimeChange}
                  className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor={id ? `${id}-end-time` : undefined}>
                  End Time
                </Label>
                <Input
                  type="time"
                  id={id ? `${id}-end-time` : undefined}
                  step="1"
                  value={formatTime(to)}
                  onChange={handleEndTimeChange}
                  className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateTimeRangePicker };
export type { DateTimeRangePickerProps };
