'use client';

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
import { CardAction } from '@workspace/ui/components/card';
import { EraserIcon, Trash2 } from 'lucide-react';

import { ProgressDialog } from '@/components/progress-dialog';

interface BulkDeleteActionProps {
  selectedCount: number;
  isBulkDeleting: boolean;
  bulkDeleteProgress: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onCancelBulkDelete: () => void;
}

export function BulkDeleteAction({
  selectedCount,
  isBulkDeleting,
  bulkDeleteProgress,
  onBulkDelete,
  onClearSelection,
  onCancelBulkDelete,
}: BulkDeleteActionProps) {
  if (selectedCount === 0) return null;

  return (
    <>
      <CardAction>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <ActionButton
                variant="destructive"
                size="sm"
                leftIcon={<Trash2 />}
                isLoading={isBulkDeleting}
                loadingText="Deleting..."
              >
                Delete
              </ActionButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete {selectedCount} Worklog
                  {selectedCount !== 1 ? 's' : ''}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{' '}
                  <span className="font-semibold">{selectedCount}</span>{' '}
                  selected worklog
                  {selectedCount !== 1 ? 's' : ''}? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onBulkDelete}>
                  Delete {selectedCount} Worklog
                  {selectedCount !== 1 ? 's' : ''}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            leftIcon={<EraserIcon />}
          >
            Clear
          </ActionButton>
        </div>
      </CardAction>

      <ProgressDialog
        open={isBulkDeleting}
        title="Deleting Worklogs..."
        description="Please wait while your worklogs are being deleted."
        progress={bulkDeleteProgress}
        onCancel={onCancelBulkDelete}
      />
    </>
  );
}
