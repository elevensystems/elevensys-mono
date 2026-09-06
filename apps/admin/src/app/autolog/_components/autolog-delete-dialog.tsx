'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import { Spinner } from '@workspace/ui/components/spinner';
import { Trash2 } from 'lucide-react';

import type { AutologConfig } from '@/types/autolog';

interface AutologDeleteDialogProps {
  /** The config awaiting confirmation; `null` keeps the dialog closed. */
  config: AutologConfig | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Confirms deleting someone else's configuration, so it names whose it is.
 *
 * The confirm button is a plain `Button`, not `AlertDialogAction` — the dialog
 * must stay open while the request is in flight, and `AlertDialogAction` closes
 * on click.
 */
export function AutologDeleteDialog({
  config,
  isDeleting,
  onOpenChange,
  onConfirm,
}: AutologDeleteDialogProps) {
  return (
    <AlertDialog open={!!config} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this autolog config?</AlertDialogTitle>
          <AlertDialogDescription>
            {config ? (
              <>
                This permanently deletes <strong>{config.username}</strong>
                &apos;s autolog configuration for{' '}
                <strong>{config.projectName}</strong> (
                {config.tickets?.length ?? 0} ticket
                {config.tickets?.length === 1 ? '' : 's'}). They will stop
                getting work logged automatically. This cannot be undone.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner /> : <Trash2 className="size-4" />}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
