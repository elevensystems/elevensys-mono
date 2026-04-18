'use client';

import { memo } from 'react';

import { Badge } from '@workspace/ui/components/badge';
import { TableCell, TableRow } from '@workspace/ui/components/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import {
  formatDisplayDate,
  getStatusVariant,
  getWorkTypeBadgeClass,
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
    <TableRow>
      <TableCell className="text-muted-foreground text-sm">
        {row.no + 1}
      </TableCell>
      <TableCell className="font-mono font-semibold">{row.key}</TableCell>
      <TableCell className="max-w-[220px]">
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
        <Badge
          variant="outline"
          className={getWorkTypeBadgeClass(row.attribute)}
        >
          {row.attribute}
        </Badge>
      </TableCell>
      <TableCell className="text-nowrap">{displayDate}</TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{row.user}</TableCell>
    </TableRow>
  );
});
