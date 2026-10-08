'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';

import { ConfigForm } from '@/components/features/autolog/config-form';
import { useProjects } from '@/hooks/use-projects';
import type {
  AutologConfig,
  CreateAutologConfigPayload,
} from '@/types/autolog';
import type { TimesheetSettings } from '@/types/timesheet';

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: TimesheetSettings;
  isConfigured: boolean;
  /** The config to edit; omit to create a new one. */
  editing?: AutologConfig;
  onSave: (payload: CreateAutologConfigPayload) => Promise<boolean>;
}

/**
 * Create- or edit-config form as a modal. Radix unmounts the content while
 * closed, so the form starts from a clean slate on every open — no manual
 * reset needed.
 */
export function ConfigDialog({
  open,
  onOpenChange,
  settings,
  isConfigured,
  editing,
  onSave,
}: ConfigDialogProps) {
  // Only reach for the project list once the modal is actually open; the list
  // page itself has no use for it.
  const { projects, isLoading: isLoadingProjects } = useProjects({
    settings,
    isConfigured: isConfigured && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* No bottom padding: the form's sticky footer sticks inside the padding
          box, so padding here would leave a strip of scrolling content under it.
          The footer's own py-4 supplies the bottom spacing. Fixed height so
          picking a project or adding rows never resizes the modal; the form
          fills the second row and pins its footer to the bottom. */}
      <DialogContent
        aria-describedby={undefined}
        className="h-[90vh] grid-rows-[auto_1fr] overflow-y-auto pb-0 sm:max-w-7xl"
      >
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Config' : 'New Config'}</DialogTitle>
        </DialogHeader>

        <ConfigForm
          settings={settings}
          projects={projects}
          isLoadingProjects={isLoadingProjects}
          editing={editing}
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
