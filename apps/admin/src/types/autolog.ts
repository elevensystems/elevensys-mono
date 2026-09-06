/**
 * The read shape of an autolog configuration, as the backend returns it.
 *
 * Admin only ever reads and deletes, so this is deliberately a subset of
 * `apps/pulse/src/types/autolog.ts` — no create/update payloads, and no
 * browser-timezone helper. Keep the field names in step with pulse; they are
 * the same records coming from the same API.
 */
export interface AutologRunResult {
  issueKey: string;
  status: 'logged' | 'skipped' | 'failed';
  message?: string;
}

export interface AutologTicket {
  description?: string;
  hours: number;
  issueKey: string;
  typeOfWork: string;
}

export interface AutologSchedule {
  type: 'weekly' | 'monthly';
  timezone: string; // IANA, e.g. "Asia/Ho_Chi_Minh"
  nextRunAt: string; // ISO UTC — the next attempt (regular slot, or a retry)
  periodAnchorAt: string; // ISO UTC — the regular slot for the period covered
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

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const STATUS_LABELS: Record<AutologConfig['status'], string> = {
  active: 'Active',
  paused_auth: 'Re-auth required',
};

export const STATUS_VARIANTS: Record<AutologConfig['status'], BadgeVariant> = {
  active: 'default',
  paused_auth: 'destructive',
};

export const RUN_STATUS_CONFIG: Record<
  NonNullable<AutologConfig['lastRunStatus']>,
  { label: string; variant: BadgeVariant }
> = {
  success: { label: 'Success', variant: 'default' },
  partial: { label: 'Partial', variant: 'secondary' },
  nothing_to_log: { label: 'Nothing to log', variant: 'outline' },
  failed: { label: 'Failed', variant: 'destructive' },
};

/**
 * The recurring slot, described from `periodAnchorAt` — deliberately not
 * `nextRunAt`, which during a retry holds a backoff instant rather than the
 * config's real slot.
 */
export function formatScheduleSlot(schedule: AutologSchedule): string | null {
  const at = Date.parse(schedule?.periodAnchorAt ?? '');
  if (!Number.isFinite(at)) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone || 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(at));
}

/** Weekday of the recurring slot, in the config's own timezone. */
export function formatScheduleWeekday(
  schedule: AutologSchedule
): string | null {
  const at = Date.parse(schedule?.periodAnchorAt ?? '');
  if (!Number.isFinite(at)) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone || 'UTC',
    weekday: 'long',
  }).format(new Date(at));
}

/** Absolute date+time of the next attempt, for the "Next run" row. */
export function formatNextRun(schedule: AutologSchedule): string | null {
  const at = Date.parse(schedule?.nextRunAt ?? '');
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

/** One-line summary of how often a config runs. */
export function formatSchedule(config: AutologConfig): string {
  const { schedule } = config;
  const at = formatScheduleSlot(schedule);
  const period =
    schedule?.type === 'monthly'
      ? 'Monthly on the last working day'
      : `Every ${formatScheduleWeekday(schedule) ?? 'Friday'}`;
  return at ? `${period} at ${at}` : period;
}

/** Short schedule label for a dense table cell. */
export function formatScheduleShort(config: AutologConfig): string {
  const { schedule } = config;
  if (schedule?.type === 'monthly') return 'Monthly';
  const weekday = formatScheduleWeekday(schedule);
  return weekday ? `Weekly · ${weekday.slice(0, 3)}` : 'Weekly';
}

export function totalHours(config: AutologConfig): number {
  return config.tickets?.reduce((sum, t) => sum + (t.hours ?? 0), 0) ?? 0;
}
