'use client';

import { memo } from 'react';

import { Badge } from '@workspace/ui/components/badge';
import { TableCell, TableRow } from '@workspace/ui/components/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';

import { UserCell } from '@/components/features/timesheet/user-cell';
import {
  formatDisplayDate,
  getStatusVariant,
  getWorkTypeDotClass,
} from '@/lib/timesheet';
import type { ProjectWorklogRow as ProjectWorklogRowData } from '@/types/timesheet';

interface ProjectWorklogRowProps {
  row: ProjectWorklogRowData;
}

export const ProjectWorklogRow = memo(function ProjectWorklogRow({
  row,
}: ProjectWorklogRowProps) {
  const displayDate = formatDisplayDate(row.date);
  const hours = parseFloat(row.worked);

  return (
    <TableRow className="transition-colors hover:bg-muted/50">
      <TableCell className="text-muted-foreground text-sm">
        {row.no + 1}
      </TableCell>
      <TableCell>
        <UserCell name={row.user} />
      </TableCell>
      <TableCell className="font-mono font-semibold text-nowrap">
        {row.key}
      </TableCell>
      <TableCell className="max-w-0">
        {row.description ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block truncate">{row.description}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm">
              <p>{row.description}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell className="text-right font-medium">
        {isNaN(hours) ? row.worked?.trim() : `${hours}h`}
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1.5 text-sm">
          <span
            className={`size-2 rounded-full shrink-0 ${getWorkTypeDotClass(row.attribute)}`}
          />
          {row.attribute}
        </span>
      </TableCell>
      <TableCell className="text-nowrap text-sm">{displayDate}</TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
      </TableCell>
    </TableRow>
  );
});
