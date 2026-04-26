import type { DateRange } from '@/types/timesheet';

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
      ranges.push({ startDate: rangeStart, endDate: rangeEnd, dates: rangeDates });
      rangeStart = dates[i];
      rangeEnd = dates[i];
      rangeDates = [dates[i]];
    }
  }

  ranges.push({ startDate: rangeStart, endDate: rangeEnd, dates: rangeDates });
  return ranges;
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
 * Deterministically map a username to an HSL color for visual differentiation.
 * Same username always produces the same hue; saturation/lightness are fixed
 * for readability on both light and dark backgrounds.
 */
export function getUsernameColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  // Multiply by the golden angle to maximally spread hues apart
  const hue = (Math.abs(hash) * 137.508) % 360;
  return `hsl(${hue}, 65%, 48%)`;
}

export function getWorkTypeDotClass(type: string): string {
  switch (type.toLowerCase()) {
    case 'correct':
      return 'bg-red-500';       // 0°
    case 'management':
      return 'bg-orange-500';    // 30°
    case 'study':
      return 'bg-yellow-400';    // 60°
    case 'test':
      return 'bg-green-500';     // 120°
    case 'translate':
      return 'bg-teal-500';      // 170°
    case 'analysis':
      return 'bg-sky-500';       // 200°
    case 'research':
      return 'bg-blue-600';      // 240°
    case 'create':
      return 'bg-violet-500';    // 270°
    case 'review':
      return 'bg-fuchsia-500';   // 300°
    default:
      return 'bg-slate-400';
  }
}

