import * as React from 'react';

import { cn } from '@workspace/ui/lib/utils';

/**
 * Single-row filter bar for the worklog and absence tables.
 *
 * The controls carry no visible label: each one states its own filter in its
 * resting text ("All users", "All types", "Pick a date range"), which is what
 * lets the row stay one line. Controls that cannot say it themselves — a native
 * select whose "All" option would otherwise read as bare "All" — spell it out
 * in the option label instead. Every control still needs an `aria-label`, since
 * dropping the `<Label>` would leave it with no accessible name.
 *
 * These filters are query parameters, not live table filters: nothing refetches
 * until the trailing submit button is pressed. Give that button `className="ml-auto"`
 * to park it at the end of the row.
 */
function FilterBar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="filter-bar"
      role="search"
      className={cn('flex w-full flex-wrap items-center gap-2', className)}
      {...props}
    />
  );
}

export { FilterBar };
