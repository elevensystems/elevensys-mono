'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';

import { ConfigForm } from '@/components/features/autolog/config-form';
import { useProjects } from '@/hooks/use-projects';
import type { CreateAutologConfigPayload } from '@/types/autolog';
import type { TimesheetSettings } from '@/types/timesheet';

interface NewConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: TimesheetSettings;
  isConfigured: boolean;
  onSave: (payload: CreateAutologConfigPayload) => Promise<boolean>;
}

/**
 * Create-config form as a modal. Radix unmounts the content while closed, so
 * the form starts from a clean slate on every open — no manual reset needed.
 */
export function NewConfigDialog({
  open,
  onOpenChange,
  settings,
  isConfigured,
  onSave,
}: NewConfigDialogProps) {
  // Only reach for the project list once the modal is actually open; the list
  // page itself has no use for it.
  const { projects, isLoading: isLoadingProjects } = useProjects({
    settings,
    isConfigured: isConfigured && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] overflow-y-auto sm:max-w-7xl"
      >
        <DialogHeader>
          <DialogTitle>New Configuration</DialogTitle>
        </DialogHeader>

        <ConfigForm
          settings={settings}
          projects={projects}
          isLoadingProjects={isLoadingProjects}
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
          showCancelButton
        />
      </DialogContent>
    </Dialog>
  );
}
