'use client';

import { getWorklogKey } from '@/hooks/use-worklogs';
import { formatHours } from '@/lib/timesheet';
import type { MyWorklogsRow } from '@/types/timesheet';

import { MyWorklogRow } from './my-worklog-row';

interface WorklogDateGroupProps {
  displayDate: string;
  totalHours: number;
  worklogs: MyWorklogsRow[];
  selectedIds: Set<string>;
  deletingId: string | null;
  onToggleSelect: (key: string) => void;
  onDelete: (worklogId: number, issueId: number) => void;
  onEdit: (worklog: MyWorklogsRow) => void;
}

export function WorklogDateGroup({
  displayDate,
  totalHours,
  worklogs,
  selectedIds,
  deletingId,
  onToggleSelect,
  onDelete,
  onEdit,
}: WorklogDateGroupProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b">
        <span className="font-semibold text-sm">{displayDate}</span>
        <span className="text-sm text-muted-foreground font-medium">
          {formatHours(totalHours)}h
        </span>
      </div>
      {worklogs.map(w => {
        const key = getWorklogKey(w);
        return (
          <MyWorklogRow
            key={key}
            worklog={w}
            isSelected={selectedIds.has(key)}
            isDeleting={deletingId === key}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        );
      })}
    </div>
  );
}
