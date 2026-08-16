'use client';

import { TableCell, TableRow } from '@workspace/ui/components/table';
import { Token } from '@workspace/ui/components/token';

import { UserCell } from '@/components/features/timesheet/user-cell';
import { formatDisplayDate, parseApiDate } from '@/lib/timesheet';
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
        <UserCell name={user.username} />
      </TableCell>
      <TableCell className="text-center">
        <span className="text-xl font-bold tabular-nums">{user.count}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          {user.dates.map(date => (
            <Token
              key={date}
              shape="pill"
              density="compact"
              color={isWeekend(date) ? 'orange' : 'yellow'}
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
