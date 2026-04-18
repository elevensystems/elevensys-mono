'use client';

import { ActionButton } from '@/components/action-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';

interface CancelConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmCancel: () => void;
  successCount: number;
}

export function CancelConfirmDialog({
  open,
  onOpenChange,
  onConfirmCancel,
  successCount,
}: CancelConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel submission?</DialogTitle>
          <DialogDescription>
            {successCount > 0
              ? `${successCount} worklog${successCount !== 1 ? 's' : ''} have already been submitted to Jira and cannot be undone. Cancel the remaining requests?`
              : 'Are you sure you want to cancel the submission?'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <ActionButton variant="outline" onClick={() => onOpenChange(false)}>
            Continue
          </ActionButton>
          <ActionButton
            variant="destructive"
            onClick={() => {
              onConfirmCancel();
              onOpenChange(false);
            }}
          >
            Cancel Submission
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
