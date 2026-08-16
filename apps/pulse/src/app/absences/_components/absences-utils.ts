import type { AbsenceRow } from '@/types/timesheet';

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
    reason: pick<string>(raw, ['reason', 'description', 'note']),
  };
}
