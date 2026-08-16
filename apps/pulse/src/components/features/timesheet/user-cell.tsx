'use client';

import { cn } from '@workspace/ui/lib/utils';

import { getUserInitials } from '@/lib/timesheet';

interface UserCellProps {
  /** Primary label — usually the Jira username. */
  name: string;
  /** Optional secondary label rendered beneath, e.g. the user's full name. */
  secondary?: string;
  className?: string;
}

/**
 * Shared rendering for the "User" column across timesheet tables: an initials
 * avatar, the name itself, and an optional secondary line.
 */
export function UserCell({ name, secondary, className }: UserCellProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className="bg-muted text-muted-foreground ring-border flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tracking-wide ring-1 ring-inset"
      >
        {getUserInitials(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium" title={name}>
          {name}
        </p>
        {secondary && (
          <p
            className="truncate text-xs text-muted-foreground"
            title={secondary}
          >
            {secondary}
          </p>
        )}
      </div>
    </div>
  );
}
