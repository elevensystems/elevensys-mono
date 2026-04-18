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
 * Get gradient badge class for work type
 */
export function getWorkTypeBadgeClass(type: string): string {
  switch (type.toLowerCase()) {
    case 'create':
      return 'border-transparent bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 text-violet-700 dark:from-violet-500/25 dark:to-fuchsia-500/25 dark:text-violet-300';
    case 'test':
      return 'border-transparent bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-700 dark:from-emerald-500/25 dark:to-teal-500/25 dark:text-emerald-300';
    case 'analysis':
      return 'border-transparent bg-gradient-to-r from-sky-500/15 to-cyan-500/15 text-sky-700 dark:from-sky-500/25 dark:to-cyan-500/25 dark:text-sky-300';
    case 'management':
      return 'border-transparent bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-700 dark:from-amber-500/25 dark:to-orange-500/25 dark:text-amber-300';
    case 'review':
      return 'border-transparent bg-gradient-to-r from-pink-500/15 to-rose-500/15 text-pink-700 dark:from-pink-500/25 dark:to-rose-500/25 dark:text-pink-300';
    case 'study':
      return 'border-transparent bg-gradient-to-r from-indigo-500/15 to-blue-500/15 text-indigo-700 dark:from-indigo-500/25 dark:to-blue-500/25 dark:text-indigo-300';
    case 'correct':
      return 'border-transparent bg-gradient-to-r from-red-500/15 to-orange-500/15 text-red-700 dark:from-red-500/25 dark:to-orange-500/25 dark:text-red-300';
    case 'translate':
      return 'border-transparent bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-blue-700 dark:from-blue-500/25 dark:to-indigo-500/25 dark:text-blue-300';
    case 'research':
      return 'border-transparent bg-gradient-to-r from-slate-500/15 to-zinc-500/15 text-slate-700 dark:from-slate-500/25 dark:to-zinc-500/25 dark:text-slate-300';
    default:
      return 'border-transparent bg-gradient-to-r from-slate-500/15 to-gray-500/15 text-slate-700 dark:from-slate-500/25 dark:to-gray-500/25 dark:text-slate-300';
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
