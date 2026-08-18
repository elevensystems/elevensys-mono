import type { WorkType } from './timesheet';

export interface AutologRunResult {
  issueKey: string;
  status: 'logged' | 'skipped' | 'failed';
  message?: string;
}

export interface AutologTicket {
  description?: string;
  hours: number;
  issueKey: string;
  typeOfWork: WorkType;
}

export interface AutologSchedule {
  type: 'weekly' | 'monthly';
  timezone: string; // IANA, e.g. "Asia/Ho_Chi_Minh"
  nextRunAt: string; // ISO UTC — the next attempt (regular slot, or a retry)
  periodAnchorAt: string; // ISO UTC — the regular slot for the period being covered
  attempt?: number; // failed attempts against the current period
}

export interface AutologConfig {
  configId: string;
  username: string;
  email: string;
  jiraInstance: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  tickets: AutologTicket[];
  schedule: AutologSchedule;
  status: 'active' | 'paused_auth';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'partial' | 'nothing_to_log' | 'failed';
  coveragePeriod: { start: string; end: string };
  lastRunResults?: AutologRunResult[];
}

/** The backend derives the run instant; the client only picks how often. */
export interface AutologSchedulePayload {
  type: 'weekly' | 'monthly';
  timezone?: string;
}

export interface CreateAutologConfigPayload {
  username: string;
  email?: string;
  jiraInstance: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  tickets: AutologTicket[];
  schedule: AutologSchedulePayload;
}

export interface UpdateAutologConfigPayload {
  username: string;
  email?: string;
  jiraInstance?: string;
  projectId?: string;
  projectKey?: string;
  projectName?: string;
  tickets?: AutologTicket[];
  schedule?: AutologSchedulePayload;
}

/** The local window the backend picks each user's slot from. */
export const RUN_WINDOW_LABEL = 'late afternoon';

/** The user's IANA timezone, sent so the backend can localise their slot. */
export function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/**
 * The recurring slot, described from `periodAnchorAt` — deliberately not
 * `nextRunAt`, which during a retry holds a backoff instant rather than the
 * user's real slot.
 */
export function formatScheduleSlot(schedule: AutologSchedule): string | null {
  const at = Date.parse(schedule.periodAnchorAt ?? '');
  if (!Number.isFinite(at)) return null;
  const tz = schedule.timezone || 'UTC';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(at));
}

/** Weekday of the recurring slot, in the config's own timezone. */
export function formatScheduleWeekday(
  schedule: AutologSchedule
): string | null {
  const at = Date.parse(schedule.periodAnchorAt ?? '');
  if (!Number.isFinite(at)) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone || 'UTC',
    weekday: 'long',
  }).format(new Date(at));
}

/** Absolute date+time of the next attempt, for the "Next run" row. */
export function formatNextRun(schedule: AutologSchedule): string | null {
  const at = Date.parse(schedule.nextRunAt ?? '');
  if (!Number.isFinite(at)) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone || 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(at));
}

/**
 * Notification address for a user. Usernames are bare FPT account names, but
 * some people save theirs with the domain already attached — appending
 * unconditionally would produce `name@fpt.com@fpt.com`.
 */
export function notificationEmail(username: string): string {
  const name = username.trim();
  return name.includes('@') ? name : `${name}@fpt.com`;
}
