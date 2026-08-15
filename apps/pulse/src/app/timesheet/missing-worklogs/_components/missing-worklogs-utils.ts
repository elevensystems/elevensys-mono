import type { MissingWorklogUser } from '@/types/timesheet';

interface SummaryParams {
  rows: MissingWorklogUser[];
  projectLabel: string;
  startDate: string;
  endDate: string;
}

/**
 * Build a plain-text report of who is missing worklogs, suitable for pasting
 * into a chat message.
 */
export function buildMissingSummary({
  rows,
  projectLabel,
  startDate,
  endDate,
}: SummaryParams): string {
  const heading = `Missing worklogs — ${projectLabel} (${startDate} → ${endDate})`;
  const lines = rows.map(
    row => `${row.username} (${row.count}): ${row.dates.join(', ')}`
  );
  return [heading, ...lines].join('\n');
}
