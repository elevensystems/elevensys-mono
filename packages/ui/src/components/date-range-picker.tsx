'use client';

import * as React from 'react';

import { Button, buttonVariants } from '@workspace/ui/components/button';
import { Calendar } from '@workspace/ui/components/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import { cn } from '@workspace/ui/lib/utils';
import { type VariantProps } from 'class-variance-authority';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { type DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  /** ISO date string (YYYY-MM-DD) for range start */
  from: string;
  /** ISO date string (YYYY-MM-DD) for range end */
  to: string;
  /** Called when the range changes */
  onRangeChange: (from: string, to: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  /** Height of the trigger button — matches Button sizes */
  size?: VariantProps<typeof buttonVariants>['size'];
}

function DateRangePicker({
  from,
  to,
  onRangeChange,
  id,
  className,
  placeholder = 'Pick a date range',
  size = 'default',
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected: DateRange | undefined = React.useMemo(() => {
    const fromDate = from ? parseISO(from) : undefined;
    const toDate = to ? parseISO(to) : undefined;
    if (!fromDate && !toDate) return undefined;
    return { from: fromDate, to: toDate };
  }, [from, to]);

  const handleSelect = React.useCallback(
    (range: DateRange | undefined) => {
      const newFrom = range?.from ? format(range.from, 'yyyy-MM-dd') : '';
      const newTo = range?.to ? format(range.to, 'yyyy-MM-dd') : '';
      onRangeChange(newFrom, newTo);
    },
    [onRangeChange]
  );

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            size={size}
            className={cn(
              'w-full justify-start text-left font-normal',
              !from && !to && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected?.from ? (
              selected.to ? (
                <>
                  {format(selected.from, 'LLL dd, y')} –{' '}
                  {format(selected.to, 'LLL dd, y')}
                </>
              ) : (
                format(selected.from, 'LLL dd, y')
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={selected?.from}
            selected={selected}
            onSelect={handleSelect}
            numberOfMonths={2}
            showOutsideDays={false}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateRangePicker };
export type { DateRangePickerProps };
