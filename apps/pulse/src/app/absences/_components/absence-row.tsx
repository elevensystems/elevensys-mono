'use client';

import { TableCell, TableRow } from '@workspace/ui/components/table';
import { Token } from '@workspace/ui/components/token';

import { UserCell } from '@/components/features/timesheet/user-cell';
import { formatDisplayDate } from '@/lib/timesheet';
import type { AbsenceRow as Absence } from '@/types/timesheet';

interface AbsenceRowProps {
  no: number;
  absence: Absence;
}

const EMPTY = '—';

/** `formatDisplayDate` falls back to "Invalid Date" on unknown formats. */
function formatDate(date?: string): string {
  if (!date) return EMPTY;
  const formatted = formatDisplayDate(date);
  return formatted.includes('Invalid') ? date : formatted;
}

export function AbsenceRow({ no, absence }: AbsenceRowProps) {
  const who = absence.username ?? absence.fullName ?? EMPTY;

  return (
    <TableRow>
      <TableCell className="text-muted-foreground tabular-nums">{no}</TableCell>
      <TableCell>
        <UserCell
          name={who}
          secondary={absence.username ? absence.fullName : undefined}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDate(absence.fromDate)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDate(absence.toDate)}
      </TableCell>
      <TableCell>
        {absence.absenceType ? (
          <Token color="blue" shape="pill" density="compact">
            {absence.absenceType}
          </Token>
        ) : (
          <span className="text-muted-foreground">{EMPTY}</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {absence.numberOfDays ?? EMPTY}
      </TableCell>
      <TableCell
        className="truncate text-muted-foreground"
        title={absence.reason}
      >
        {absence.reason ?? EMPTY}
      </TableCell>
    </TableRow>
  );
}
