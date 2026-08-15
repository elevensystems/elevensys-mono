'use client';

import { TableCell, TableRow } from '@workspace/ui/components/table';
import { Token } from '@workspace/ui/components/token';

import {
  formatDisplayDate,
  getUsernameColor,
  parseApiDate,
} from '@/lib/timesheet';
import type { MissingWorklogUser } from '@/types/timesheet';

interface MissingUserRowProps {
  no: number;
  user: MissingWorklogUser;
}

/** "03/Aug/26" → "03 Aug" — the chips only need day and month. */
function formatChip(date: string): string {
  const parsed = parseApiDate(date);
  if (!parsed) return date;
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function isWeekend(date: string): boolean {
  const parsed = parseApiDate(date);
  if (!parsed) return false;
  const day = parsed.getDay();
  return day === 0 || day === 6;
}

export function MissingUserRow({ no, user }: MissingUserRowProps) {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground tabular-nums">{no}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: getUsernameColor(user.username) }}
          />
          <span className="truncate font-medium">{user.username}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Token color={user.count > 4 ? 'red' : 'yellow'} density="compact">
          {user.count}
        </Token>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          {user.dates.map(date => (
            <Token
              key={date}
              shape="pill"
              density="compact"
              color={isWeekend(date) ? 'orange' : 'gray'}
              title={formatDisplayDate(date)}
            >
              {formatChip(date)}
            </Token>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}
