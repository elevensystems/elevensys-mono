'use client';

import { DateRangePicker } from '@workspace/ui/components/date-range-picker';

import { useRangeParams } from '@/hooks/use-claude-watch';

/** Shared date-range control. Persists the range in the URL (`?from=&to=`). */
export function DateRangeControl() {
  const { from, to, setRange } = useRangeParams();

  return (
    <DateRangePicker
      from={from}
      to={to}
      onRangeChange={(nextFrom, nextTo) => {
        if (nextFrom && nextTo) setRange(nextFrom, nextTo);
      }}
      className="w-auto"
    />
  );
}
