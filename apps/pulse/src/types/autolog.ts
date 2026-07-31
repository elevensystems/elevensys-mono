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
  dayOfWeek?: number; // 0=Sun..6=Sat
  dayOfMonth?: number; // 1-31
  hour: number; // 0-23 UTC
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

export interface CreateAutologConfigPayload {
  username: string;
  email?: string;
  jiraInstance: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  tickets: AutologTicket[];
  schedule: AutologSchedule;
}

export interface UpdateAutologConfigPayload {
  username: string;
  email?: string;
  jiraInstance?: string;
  projectId?: string;
  projectKey?: string;
  projectName?: string;
  tickets?: AutologTicket[];
  schedule?: AutologSchedule;
}

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00 UTC`,
}));
