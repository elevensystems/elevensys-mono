'use client';

import { useMemo } from 'react';

import { TooltipProvider } from '@workspace/ui/components/tooltip';
import type { RequestStatus } from '@/types/timesheet';

import { EntryStatusRow } from './entry-status-row';

interface EntryStatusListProps {
  statuses: RequestStatus[];
}

export function EntryStatusList({ statuses }: EntryStatusListProps) {
  // Group statuses by entryId, preserving order
  const entries = useMemo(() => {
    const map = new Map<
      string,
      { issueKey: string; dateStatuses: RequestStatus[] }
    >();
    for (const rs of statuses) {
      if (!map.has(rs.entryId)) {
        map.set(rs.entryId, { issueKey: rs.issueKey, dateStatuses: [] });
      }
      map.get(rs.entryId)!.dateStatuses.push(rs);
    }
    return Array.from(map.entries());
  }, [statuses]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-h-[300px] overflow-y-auto rounded-lg border">
        {entries.map(([entryId, { issueKey, dateStatuses }]) => (
          <EntryStatusRow
            key={entryId}
            issueKey={issueKey}
            dateStatuses={dateStatuses}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
