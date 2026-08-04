import type { RequestStatus } from '@/types/timesheet';

export interface EntryStatusGroup {
  entryId: string;
  issueKey: string;
  dateStatuses: RequestStatus[];
}

/** Group a flat RequestStatus[] by entryId, preserving first-seen order. */
export function groupStatusesByEntry(
  statuses: RequestStatus[]
): EntryStatusGroup[] {
  const map = new Map<string, EntryStatusGroup>();
  for (const rs of statuses) {
    if (!map.has(rs.entryId)) {
      map.set(rs.entryId, {
        entryId: rs.entryId,
        issueKey: rs.issueKey,
        dateStatuses: [],
      });
    }
    map.get(rs.entryId)!.dateStatuses.push(rs);
  }
  return Array.from(map.values());
}

export interface StatusCounts {
  successCount: number;
  failedCount: number;
  skippedCount: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  totalRanges: number;
  issueCount: number;
}

export function getStatusCounts(statuses: RequestStatus[]): StatusCounts {
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  let pendingCount = 0;
  let inProgressCount = 0;
  const issueIds = new Set<string>();

  for (const s of statuses) {
    issueIds.add(s.entryId);
    switch (s.status) {
      case 'success':
        successCount++;
        break;
      case 'failed':
        failedCount++;
        break;
      case 'skipped':
        skippedCount++;
        break;
      case 'pending':
        pendingCount++;
        break;
      case 'in-progress':
        inProgressCount++;
        break;
    }
  }

  return {
    successCount,
    failedCount,
    skippedCount,
    pendingCount,
    inProgressCount,
    completedCount: successCount + failedCount + skippedCount,
    totalRanges: statuses.length,
    issueCount: issueIds.size,
  };
}

export type OverallStatus = 'in-progress' | 'complete' | 'partial' | 'failed';

export function classifyOverallStatus(
  isSubmitting: boolean,
  successCount: number,
  failedCount: number,
  skippedCount: number
): OverallStatus {
  if (isSubmitting) return 'in-progress';
  if (failedCount === 0 && skippedCount === 0) return 'complete';
  if (successCount === 0) return 'failed';
  return 'partial';
}

export type IssueState =
  | 'failed'
  | 'in-progress'
  | 'pending'
  | 'skipped'
  | 'success';

export function classifyIssueState(dateStatuses: RequestStatus[]): IssueState {
  if (dateStatuses.some(s => s.status === 'failed')) return 'failed';
  if (dateStatuses.some(s => s.status === 'in-progress')) return 'in-progress';
  if (dateStatuses.some(s => s.status === 'pending')) return 'pending';
  if (dateStatuses.every(s => s.status === 'skipped')) return 'skipped';
  return 'success';
}

/** e.g. "all submitted" / "2 pending" / "1 failed · 1 skipped" */
export function formatIssueSummary(dateStatuses: RequestStatus[]): string {
  const total = dateStatuses.length;
  const successCount = dateStatuses.filter(s => s.status === 'success').length;
  const failedCount = dateStatuses.filter(s => s.status === 'failed').length;
  const skippedCount = dateStatuses.filter(s => s.status === 'skipped').length;
  const remaining = dateStatuses.filter(
    s => s.status === 'pending' || s.status === 'in-progress'
  ).length;

  if (successCount === total) return 'all submitted';
  if (failedCount === 0 && remaining > 0) return `${remaining} pending`;

  const parts: string[] = [];
  if (failedCount > 0) parts.push(`${failedCount} failed`);
  if (skippedCount > 0) parts.push(`${skippedCount} skipped`);
  return parts.join(' · ');
}

/** Splits a failed range's error into a "{label} · {message}" pair for inline display. */
export function splitErrorMessage(
  raw?: string,
  status?: number
): { label: string; message: string } {
  if (status) {
    return { label: `Jira ${status}`, message: raw || 'Request failed' };
  }
  if (raw && /timeout/i.test(raw)) {
    return { label: 'Network timeout', message: 'No response from Jira' };
  }
  if (raw && /failed to fetch|network/i.test(raw)) {
    return { label: 'Network error', message: raw };
  }
  return { label: 'Jira error', message: raw || 'Unknown error' };
}
