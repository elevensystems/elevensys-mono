'use client';

import { memo, useCallback } from 'react';

import { SquarePenIcon, Trash2Icon } from 'lucide-react';

import { ActionButton } from '@workspace/ui/components/action-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';
import { Badge } from '@workspace/ui/components/badge';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Spinner } from '@workspace/ui/components/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { getWorklogKey } from '@/hooks/use-worklogs';
import {
  formatDisplayDate,
  formatHours,
  getStatusVariant,
  getWorkTypeDotColor,
} from '@/lib/timesheet';
import type { MyWorklogsRow } from '@/types/timesheet';

interface MyWorklogRowProps {
  worklog: MyWorklogsRow;
  isSelected: boolean;
  isDeleting: boolean;
  onToggleSelect: (key: string) => void;
  onDelete: (worklogId: number, issueId: number) => void;
  onEdit: (worklog: MyWorklogsRow) => void;
}

const EDITABLE_STATUSES = ['pending', 'rejected', 'reopened'];

export const MyWorklogRow = memo(function MyWorklogRow({
  worklog,
  isSelected,
  isDeleting,
  onToggleSelect,
  onDelete,
  onEdit,
}: MyWorklogRowProps) {
  const key = getWorklogKey(worklog);
  const isEditable = EDITABLE_STATUSES.includes(
    worklog.statusWorklog?.toLowerCase() ?? ''
  );
  const displayDate = worklog.startDateEdit
    ? formatDisplayDate(worklog.startDateEdit)
    : worklog.startDate;

  const handleToggle = useCallback(() => onToggleSelect(key), [key, onToggleSelect]);
  const handleEdit = useCallback(() => onEdit(worklog), [worklog, onEdit]);
  const handleDelete = useCallback(
    () => onDelete(worklog.id, worklog.issueId),
    [worklog.id, worklog.issueId, onDelete]
  );

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0 transition-colors ${isSelected ? 'bg-muted/60' : 'hover:bg-muted/30'}`}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={handleToggle}
        disabled={!isEditable}
        aria-label={`Select ${worklog.issueKey}`}
        className="shrink-0"
      />

      <span className="font-mono font-semibold text-sm shrink-0 w-30 truncate">
        {worklog.issueKey}
      </span>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex-1 truncate text-sm min-w-0">
              {worklog.description || '-'}
            </span>
          </TooltipTrigger>
          {worklog.description && (
            <TooltipContent side="bottom" className="max-w-sm">
              <p>{worklog.description}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <span className="text-sm font-medium shrink-0 w-10 text-right">
        {formatHours(Number(worklog.worked))}h
      </span>

      <span className="flex items-center gap-1.5 text-sm shrink-0 w-24">
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: getWorkTypeDotColor(worklog.typeOfWork) }}
        />
        {worklog.typeOfWork}
      </span>

      <div className="shrink-0 w-20">
        <Badge variant={getStatusVariant(worklog.statusWorklog)}>
          {worklog.statusWorklog}
        </Badge>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isDeleting ? (
          <Spinner />
        ) : (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionButton
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={!isEditable}
                    onClick={handleEdit}
                    leftIcon={<SquarePenIcon />}
                    aria-label="Edit"
                  />
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AlertDialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <ActionButton
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        disabled={!isEditable}
                        leftIcon={<Trash2Icon />}
                        aria-label="Delete"
                      />
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Worklog</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this worklog for{' '}
                    <span className="font-semibold">{worklog.issueKey}</span>{' '}
                    ({formatHours(Number(worklog.worked))}h on {displayDate})?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
});
