'use client';

import { TableCell, TableRow } from '@workspace/ui/components/table';
import { Token } from '@workspace/ui/components/token';

import { formatDisplayDate, getUsernameColor } from '@/lib/timesheet';
import type { AbsenceRow as Absence } from '@/types/timesheet';

import { getAbsenceStatusColor } from './absences-utils';

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
        <div className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: getUsernameColor(who) }}
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{who}</p>
            {absence.fullName && absence.username && (
              <p className="truncate text-xs text-muted-foreground">
                {absence.fullName}
              </p>
            )}
          </div>
        </div>
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
      <TableCell>
        {absence.status ? (
          <Token
            color={getAbsenceStatusColor(absence.status)}
            shape="pill"
            density="compact"
          >
            {absence.status}
          </Token>
        ) : (
          <span className="text-muted-foreground">{EMPTY}</span>
        )}
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
