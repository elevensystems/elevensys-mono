import type { AbsenceRow } from '@/types/timesheet';

/** Colors accepted by `Token`; narrowed to the ones a status can map to. */
type TokenColor = 'green' | 'yellow' | 'red' | 'gray';

/**
 * Returns the first key present on `raw` from a list of candidates.
 *
 * The upstream absence resource is an untyped passthrough, so the exact field
 * names are unverified. Reading through candidate sets lets the page render
 * whatever the plugin actually returns. Once a real payload is confirmed, the
 * candidate lists here can collapse to the single true name.
 */
function pick<T>(raw: AbsenceRow, keys: string[]): T | undefined {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && value !== '') {
      return value as T;
    }
  }
  return undefined;
}

/** Map an arbitrary upstream row onto the fields the table renders. */
export function normalizeAbsence(raw: AbsenceRow): AbsenceRow {
  return {
    ...raw,
    id: pick<number | string>(raw, ['id', 'absenceId', 'recordId']),
    username: pick<string>(raw, ['username', 'userName', 'user']),
    fullName: pick<string>(raw, ['fullName', 'displayName', 'name']),
    fromDate: pick<string>(raw, ['fromDate', 'startDate', 'from']),
    toDate: pick<string>(raw, ['toDate', 'endDate', 'to']),
    absenceType: pick<string>(raw, ['absenceType', 'type', 'leaveType']),
    numberOfDays: pick<number>(raw, ['numberOfDays', 'days', 'duration']),
    status: pick<string>(raw, ['status', 'state']),
    reason: pick<string>(raw, ['reason', 'description', 'note']),
  };
}

/** Token color for an absence approval status. */
export function getAbsenceStatusColor(status: string): TokenColor {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'accepted':
      return 'green';
    case 'pending':
    case 'waiting':
      return 'yellow';
    case 'rejected':
    case 'cancelled':
    case 'canceled':
      return 'red';
    default:
      return 'gray';
  }
}

interface SummaryParams {
  rows: AbsenceRow[];
  projectLabel: string;
  startDate: string;
  endDate: string;
}

/**
 * Build a plain-text report of the current page of absences, suitable for
 * pasting into a chat message.
 */
export function buildAbsencesSummary({
  rows,
  projectLabel,
  startDate,
  endDate,
}: SummaryParams): string {
  const heading = `Absences — ${projectLabel} (${startDate} → ${endDate})`;

  const lines = rows.map(row => {
    const who = row.username ?? row.fullName ?? 'Unknown';
    const days = row.numberOfDays != null ? ` (${row.numberOfDays}d)` : '';
    const range =
      row.fromDate && row.toDate && row.fromDate !== row.toDate
        ? `${row.fromDate} → ${row.toDate}`
        : (row.fromDate ?? row.toDate ?? '');
    const type = row.absenceType ? ` — ${row.absenceType}` : '';
    return `${who}${days}: ${range}${type}`;
  });

  return [heading, ...lines].join('\n');
}
