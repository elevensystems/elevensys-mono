import type {
  DateRange,
  FailedWorklog,
  MissingWorklogUser,
  RequestStatus,
  WorkEntry,
  WorklogProfile,
  WorklogProfileStore,
  WorklogsWarningEntry,
} from '@/types/timesheet';

const MONTH_ABBRS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const STANDARD_HOURS = 8;
export const MIN_HOURS = 0.1;
export const MAX_HOURS = 24;
export const DEFAULT_HOURS = 1;
export const HOUR_STEP = 0.5;
export const REQUEST_DELAY_MS = 1500;
export const SETTINGS_STORAGE_KEY = 'timesheet_settings';
export const SELECTED_PROJECT_STORAGE_KEY = 'pulse_selected_project';

/**
 * Parse Jira date format "D/Mon/YY" or "DD/Mon/YY" to a Date object (local time).
 * Returns null if the format doesn't match.
 */
export function parseApiDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2})$/);
  if (!match) return null;
  const [, day, monthAbbr, yearShort] = match;
  const monthIndex = MONTH_ABBRS.findIndex(
    m => m.toLowerCase() === monthAbbr.toLowerCase()
  );
  if (monthIndex === -1) return null;
  return new Date(
    2000 + parseInt(yearShort, 10),
    monthIndex,
    parseInt(day, 10)
  );
}

/**
 * Convert Jira date format "D/Mon/YY" to ISO "YYYY-MM-DD".
 * Falls back to the raw string if parsing fails.
 */
export function jiraDateToISO(dateStr: string): string {
  const date = parseApiDate(dateStr);
  if (!date) return dateStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert YYYY-MM-DD to Jira API format D/Mon/YY
 * e.g. "2025-01-15" → "15/Jan/25"
 */
export function formatDateForApi(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = MONTH_ABBRS[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Get current time string in API format " HH:mm:ss"
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return ` ${hours}:${minutes}:${seconds}`;
}

export function generateEntryId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** A single empty work entry with a fresh id, used as the default row. */
export function createDefaultEntry(): WorkEntry {
  return {
    id: generateEntryId(),
    issueKey: '',
    typeOfWork: 'Create',
    description: '',
    hours: DEFAULT_HOURS,
  };
}

const SAVED_ENTRIES_KEY = 'timesheet_saved_entries';
const WORKLOG_PROFILES_KEY = 'timesheet_worklog_profiles';
const FAILED_WORKLOGS_KEY = 'timesheet_failed_worklogs';

function projectStorageKey(base: string, projectId: string): string {
  return `${base}::project::${projectId}`;
}

export function worklogProfilesStorageKey(projectId: string): string {
  return projectStorageKey(WORKLOG_PROFILES_KEY, projectId);
}

export function failedWorklogsStorageKey(projectId: string): string {
  return projectStorageKey(FAILED_WORKLOGS_KEY, projectId);
}

export const DEFAULT_PROFILE_NAME = 'Default';
export const MAX_PROFILE_NAME_LENGTH = 40;

type StoredEntry = Omit<WorkEntry, 'id'>;

interface StoredProfileStore {
  activeId: string;
  profiles: { id: string; name: string; entries: StoredEntry[] }[];
}

/** Stored entries get fresh ids on load so React keys stay unique. */
function hydrateEntries(stored: unknown): WorkEntry[] {
  if (!Array.isArray(stored) || stored.length === 0) {
    return [createDefaultEntry()];
  }
  return (stored as StoredEntry[]).map(entry => ({
    ...entry,
    id: generateEntryId(),
  }));
}

/**
 * Drops only fully blank rows, so a row whose ticket is being swapped keeps
 * its description. Ids are regenerated on load.
 */
function dehydrateEntries(entries: WorkEntry[]): StoredEntry[] {
  return entries
    .filter(e => e.issueKey.trim() || e.description.trim())
    .map(({ id: _id, ...rest }) => rest);
}

/** The single per-project list saved before profiles existed. */
function loadLegacyEntries(projectId: string): WorkEntry[] {
  try {
    const saved = localStorage.getItem(
      projectStorageKey(SAVED_ENTRIES_KEY, projectId)
    );
    if (saved) return hydrateEntries(JSON.parse(saved));
  } catch {
    // Ignore corrupted data
  }
  return [createDefaultEntry()];
}

export function createWorklogProfile(
  name: string,
  entries: WorkEntry[] = [createDefaultEntry()]
): WorklogProfile {
  return { id: generateEntryId(), name, entries };
}

/** "Profile N", counting on from the number of profiles and skipping names in use. */
export function nextProfileName(profiles: WorklogProfile[]): string {
  const taken = new Set(profiles.map(p => p.name));
  let n = profiles.length + 1;
  while (taken.has(`Profile ${n}`)) n++;
  return `Profile ${n}`;
}

/**
 * Load a project's worklog profiles from localStorage. A project that only
 * has the pre-profiles single list gets it as its first profile.
 */
export function loadWorklogProfiles(projectId: string): WorklogProfileStore {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(worklogProfilesStorageKey(projectId));
      if (raw) {
        const parsed = JSON.parse(raw) as StoredProfileStore;
        const profiles = (parsed.profiles ?? [])
          .filter(p => p && typeof p.id === 'string')
          .map(p => ({
            id: p.id,
            name: p.name || DEFAULT_PROFILE_NAME,
            entries: hydrateEntries(p.entries),
          }));
        if (profiles.length > 0) {
          const activeId = profiles.some(p => p.id === parsed.activeId)
            ? parsed.activeId
            : profiles[0].id;
          return { activeId, profiles };
        }
      }
    } catch {
      // Ignore corrupted data
    }
  }

  const profile = createWorklogProfile(
    DEFAULT_PROFILE_NAME,
    typeof window === 'undefined'
      ? [createDefaultEntry()]
      : loadLegacyEntries(projectId)
  );
  return { activeId: profile.id, profiles: [profile] };
}

export function saveWorklogProfiles(
  store: WorklogProfileStore,
  projectId: string
): void {
  try {
    const toSave: StoredProfileStore = {
      activeId: store.activeId,
      profiles: store.profiles.map(p => ({
        id: p.id,
        name: p.name,
        entries: dehydrateEntries(p.entries),
      })),
    };
    localStorage.setItem(
      worklogProfilesStorageKey(projectId),
      JSON.stringify(toSave)
    );
  } catch {
    // Ignore storage errors
  }
}

function isStoredEntry(value: unknown): value is WorkEntry {
  const entry = value as WorkEntry | null;
  return (
    !!entry &&
    typeof entry.id === 'string' &&
    typeof entry.issueKey === 'string' &&
    typeof entry.typeOfWork === 'string' &&
    typeof entry.description === 'string' &&
    typeof entry.hours === 'number'
  );
}

function isStoredRange(value: unknown): value is DateRange {
  const range = value as DateRange | null;
  return (
    !!range &&
    typeof range.startDate === 'string' &&
    typeof range.endDate === 'string' &&
    Array.isArray(range.dates) &&
    range.dates.length > 0 &&
    range.dates.every(d => typeof d === 'string' && parseApiDate(d) !== null)
  );
}

/** Checks every field later code reads, so junk in storage is dropped on load. */
function isFailedWorklog(value: unknown): value is FailedWorklog {
  const item = value as FailedWorklog | null;
  return (
    !!item &&
    isStoredEntry(item.entry) &&
    Array.isArray(item.ranges) &&
    item.ranges.length > 0 &&
    item.ranges.every(isStoredRange)
  );
}

export function loadFailedWorklogs(projectId: string): FailedWorklog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(failedWorklogsStorageKey(projectId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isFailedWorklog) : [];
  } catch {
    return [];
  }
}

export function saveFailedWorklogs(
  failed: FailedWorklog[],
  projectId: string
): void {
  const key = failedWorklogsStorageKey(projectId);
  try {
    if (failed.length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(failed));
  } catch {
    // Ignore storage errors
  }
}

/**
 * A request that was not confirmed as logged — failed, skipped by a cancel, or
 * never reached. The one definition of "still missing" for a run's statuses.
 */
export function isUnlogged(status: RequestStatus): boolean {
  return status.status !== 'success' && status.dates.length > 0;
}

/** The date range a request covered, rebuilt from its dates. */
export function statusRange(status: RequestStatus): DateRange {
  return {
    startDate: status.dates[0],
    endDate: status.dates[status.dates.length - 1],
    dates: status.dates,
  };
}

/**
 * Every row × range of a run that was not confirmed as logged, grouped back
 * per row. Built from the per-request statuses rather than the per-row
 * results, so a row that succeeded on some ranges only keeps the ranges it
 * still needs.
 */
export function collectFailedWorklogs(
  statuses: RequestStatus[],
  entriesById: ReadonlyMap<string, WorkEntry>
): FailedWorklog[] {
  const byEntry = new Map<string, FailedWorklog>();
  for (const status of statuses) {
    if (!isUnlogged(status)) continue;
    const entry = entriesById.get(status.entryId);
    if (!entry) continue;

    let failed = byEntry.get(status.entryId);
    if (!failed) {
      failed = { entry: { ...entry, id: generateEntryId() }, ranges: [] };
      byEntry.set(status.entryId, failed);
    }
    failed.ranges.push(statusRange(status));
    const reason =
      status.status === 'failed' ? status.error || 'Failed' : 'Not sent';
    const label = `${status.rangeLabel}: ${reason}`;
    failed.error = failed.error ? `${failed.error}; ${label}` : label;
  }
  return [...byEntry.values()];
}

/**
 * Identifies the work a row logs. Rows with the same key are the same
 * worklog: a retry list keeps them as one item, and logging one covers the
 * other. Two rows on one ticket that differ in any field are separate work.
 */
function workKey(entry: WorkEntry): string {
  return JSON.stringify([
    entry.issueKey.trim(),
    entry.typeOfWork,
    entry.description.trim(),
    entry.hours,
  ]);
}

function sortApiDates(dates: Iterable<string>): string[] {
  return [...new Set(dates)].sort(
    (a, b) =>
      (parseApiDate(a)?.getTime() ?? 0) - (parseApiDate(b)?.getTime() ?? 0)
  );
}

/**
 * Fold a finished run into the retry list: drop every date the run logged for
 * the same work (whichever list item it came from, so a normal submit clears
 * it too), then add what the run left unlogged, merging items that describe
 * the same work. Another row on the same ticket and date — a 2h Review next
 * to a failed 6h Create — is different work and clears nothing.
 */
export function reconcileFailedWorklogs(
  previous: FailedWorklog[],
  statuses: RequestStatus[],
  entriesById: ReadonlyMap<string, WorkEntry>
): FailedWorklog[] {
  const logged = new Set<string>();
  for (const status of statuses) {
    const entry = entriesById.get(status.entryId);
    if (status.status !== 'success' || !entry) continue;
    const key = workKey(entry);
    status.dates.forEach(d => logged.add(`${key}|${d}`));
  }

  const merged = new Map<
    string,
    { entry: WorkEntry; dates: string[]; error?: string }
  >();
  const add = (item: FailedWorklog) => {
    const key = workKey(item.entry);
    const dates = item.ranges
      .flatMap(r => r.dates)
      .filter(d => !logged.has(`${key}|${d}`));
    if (dates.length === 0) return;
    const existing = merged.get(key);
    if (existing) {
      existing.dates.push(...dates);
      existing.error = item.error ?? existing.error;
    } else {
      merged.set(key, { entry: item.entry, dates, error: item.error });
    }
  };
  previous.forEach(add);
  collectFailedWorklogs(statuses, entriesById).forEach(add);

  return [...merged.values()].map(({ entry, dates, error }) => ({
    entry,
    ranges: groupDatesIntoRanges(sortApiDates(dates)),
    error,
  }));
}

/** The rows with a ticket in a project's active worklog profile (for Autolog prefill). */
export function loadSavedEntries(projectId: string): WorkEntry[] {
  const store = loadWorklogProfiles(projectId);
  const active = store.profiles.find(p => p.id === store.activeId);
  const keyed = active?.entries.filter(e => e.issueKey.trim()) ?? [];
  return keyed.length > 0 ? keyed : [createDefaultEntry()];
}

/**
 * Jira ticket format regex: uppercase alphanumerics + dash + number
 * Examples: C99CMSMKPCM1-01, C99KBBATC2025-37
 */
export const JIRA_TICKET_REGEX = /^[A-Z0-9]+-\d+$/;

/**
 * Validate Jira issue key format
 * @param key - The issue key to validate (e.g., "C99CMSMKPCM1-01")
 * @returns true if valid, false otherwise
 */
export function isValidIssueKey(key: string): boolean {
  const trimmed = key.trim().toUpperCase();
  return JIRA_TICKET_REGEX.test(trimmed);
}

/**
 * Format a date string to a human-readable date
 * Supports: "2025-01-15" (ISO) or "06/Feb/26" (Jira DD/Mon/YY)
 * → "Jan 15, 2025" or "Feb 6, 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  // Handle Jira format: "DD/Mon/YY"
  const tempoMatch = dateStr.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2})$/);
  if (tempoMatch) {
    const [, day, monthAbbr, yearShort] = tempoMatch;
    const monthIndex = MONTH_ABBRS.findIndex(
      m => m.toLowerCase() === monthAbbr.toLowerCase()
    );
    if (monthIndex !== -1) {
      const fullYear = 2000 + parseInt(yearShort, 10);
      const date = new Date(fullYear, monthIndex, parseInt(day, 10));
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }

  // Fallback: ISO format "YYYY-MM-DD"
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get the first day of the current month as YYYY-MM-DD
 */
export function getMonthStart(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Get the last day of the current month as YYYY-MM-DD
 */
export function getMonthEnd(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Group a sorted array of Jira-format date strings into contiguous date ranges.
 * Two dates are contiguous only if they are exactly 1 calendar day apart.
 * This ensures ranges never span weekends or holidays.
 */
export function groupDatesIntoRanges(dates: string[]): DateRange[] {
  if (dates.length === 0) return [];

  const ranges: DateRange[] = [];
  let rangeStart = dates[0];
  let rangeEnd = dates[0];
  let rangeDates: string[] = [dates[0]];

  for (let i = 1; i < dates.length; i++) {
    const prev = parseApiDate(dates[i - 1]);
    const curr = parseApiDate(dates[i]);

    const isConsecutive =
      prev !== null &&
      curr !== null &&
      curr.getTime() - prev.getTime() === 24 * 60 * 60 * 1000;

    if (isConsecutive) {
      rangeEnd = dates[i];
      rangeDates.push(dates[i]);
    } else {
      ranges.push({
        startDate: rangeStart,
        endDate: rangeEnd,
        dates: rangeDates,
      });
      rangeStart = dates[i];
      rangeEnd = dates[i];
      rangeDates = [dates[i]];
    }
  }

  ranges.push({ startDate: rangeStart, endDate: rangeEnd, dates: rangeDates });
  return ranges;
}

/**
 * Turn the warning endpoint's {key, value} entries into one row per user.
 * `key` is the Jira username, `value` a comma-separated list of missing dates.
 * Dates are sorted chronologically, users with no dates are dropped, and rows
 * are ordered by most missing days first, then username.
 */
export function parseWarningEntries(
  entries: WorklogsWarningEntry[]
): MissingWorklogUser[] {
  return entries
    .map(entry => {
      const dates = (entry.value ?? '')
        .split(',')
        .map(date => date.trim())
        .filter(Boolean)
        .sort((a, b) => {
          const dateA = parseApiDate(a);
          const dateB = parseApiDate(b);
          if (!dateA || !dateB) return a.localeCompare(b);
          return dateA.getTime() - dateB.getTime();
        });

      return { username: entry.key, dates, count: dates.length };
    })
    .filter(user => user.count > 0)
    .sort((a, b) =>
      b.count !== a.count
        ? b.count - a.count
        : a.username.localeCompare(b.username)
    );
}

/**
 * Format a DateRange as a human-readable label.
 * Single-date range: "4/May/26"
 * Multi-date range: "4/May/26 → 8/May/26"
 */
export function formatRangeLabel(range: DateRange): string {
  if (range.startDate === range.endDate) return range.startDate;
  return `${range.startDate} → ${range.endDate}`;
}

/**
 * Delay execution for a given number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get badge variant for worklog status
 */
export function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Format a numeric hours value for display.
 * Integers are shown without decimals; decimals are trimmed of trailing zeros.
 * e.g. 8 → "8", 1.5 → "1.5", 1.10 → "1.1"
 */
export function formatHours(value: number): string {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Build up-to-two-letter initials for an avatar.
 * Names split on separators use the first letter of the first two parts
 * ("nguyen.van.a" → "NV"); a single word falls back to its first two letters
 * ("ducptm" → "DU").
 */
export function getUserInitials(username: string): string {
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

const WORK_TYPE_DOT_CLASS: Record<string, string> = {
  create: 'bg-worktype-create',
  review: 'bg-worktype-review',
  study: 'bg-worktype-study',
  correct: 'bg-worktype-correct',
  translate: 'bg-worktype-translate',
  test: 'bg-worktype-test',
};

const WORK_TYPE_BORDER_CLASS: Record<string, string> = {
  create: 'border-worktype-create',
  review: 'border-worktype-review',
  study: 'border-worktype-study',
  correct: 'border-worktype-correct',
  translate: 'border-worktype-translate',
  test: 'border-worktype-test',
};

const DEFAULT_WORK_TYPE_DOT_CLASS = 'bg-token-gray-fg';
const DEFAULT_WORK_TYPE_BORDER_CLASS = 'border-token-gray-fg';

export function getWorkTypeDotClass(type: string): string {
  return WORK_TYPE_DOT_CLASS[type.toLowerCase()] ?? DEFAULT_WORK_TYPE_DOT_CLASS;
}

/**
 * Pill/badge classes (solid background + white text) for a work type.
 */
export function getWorkTypeBadgeClass(type: string): string {
  return `${getWorkTypeDotClass(type)} text-white`;
}

/**
 * Solid border color for a work type, used as a left accent stripe on entry rows.
 */
export function getWorkTypeBorderClass(type: string): string {
  return (
    WORK_TYPE_BORDER_CLASS[type.toLowerCase()] ?? DEFAULT_WORK_TYPE_BORDER_CLASS
  );
}
