'use client';

import { useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Input } from '@workspace/ui/components/input';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Copy, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

import { MAX_PROFILE_NAME_LENGTH } from '@/lib/timesheet';
import type { WorklogProfile } from '@/types/timesheet';

interface WorklogProfileTabsProps {
  profiles: WorklogProfile[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => string;
  onDuplicate: (id: string) => string;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

function countEntries(profile: WorklogProfile): number {
  return profile.entries.filter(e => e.issueKey.trim()).length;
}

/**
 * Underline tabs for switching between a project's worklog profiles. Sits in
 * the entries panel's header; the underline lands on the body's top edge so
 * the active tab reads as attached to the rows below.
 */
export function WorklogProfileTabs({
  profiles,
  activeId,
  onSelect,
  onCreate,
  onDuplicate,
  onRename,
  onDelete,
  disabled = false,
}: WorklogProfileTabsProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // The menu hands focus back to its trigger on close, which would steal it
  // from a rename input that just mounted.
  const keepFocusOnCloseRef = useRef(false);
  // Closing the input fires blur, which must not commit a second time or
  // commit after Escape.
  const renameSettledRef = useRef(false);

  const activeProfile = profiles.find(p => p.id === activeId);
  const pendingDelete = profiles.find(p => p.id === pendingDeleteId);

  const startRename = (id: string, name: string) => {
    renameSettledRef.current = false;
    setDraftName(name);
    setRenamingId(id);
  };

  const finishRename = (commit: boolean) => {
    if (renameSettledRef.current) return;
    renameSettledRef.current = true;
    if (commit && renamingId) onRename(renamingId, draftName);
    setRenamingId(null);
  };

  const handleCreate = () => {
    const id = onCreate();
    startRename(id, '');
  };

  return (
    <>
      <Tabs
        value={activeId}
        onValueChange={onSelect}
        className="min-w-48 flex-1 gap-0 self-stretch"
      >
        <div className="flex h-full min-w-0 items-stretch gap-1 overflow-x-auto">
          <TabsList
            aria-label="Worklog profiles"
            className="h-full items-stretch gap-1 rounded-none bg-transparent p-0"
          >
            {profiles.map(profile =>
              profile.id === renamingId ? (
                <div
                  key={profile.id}
                  className="relative flex items-center px-1 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground"
                >
                  <Input
                    autoFocus
                    aria-label="Profile name"
                    value={draftName}
                    placeholder={profile.name}
                    maxLength={MAX_PROFILE_NAME_LENGTH}
                    onChange={e => setDraftName(e.target.value)}
                    onFocus={e => e.currentTarget.select()}
                    onBlur={() => finishRename(true)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') finishRename(true);
                      if (e.key === 'Escape') finishRename(false);
                    }}
                    className="h-8 w-40"
                  />
                </div>
              ) : (
                <TabsTrigger
                  key={profile.id}
                  value={profile.id}
                  disabled={disabled}
                  onDoubleClick={() => startRename(profile.id, profile.name)}
                  title="Double-click to rename"
                  className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground relative h-full flex-none border-0 bg-transparent px-3 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent"
                >
                  <span className="max-w-40 truncate">{profile.name}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {countEntries(profile)}
                  </span>
                </TabsTrigger>
              )
            )}
          </TabsList>

          <div className="flex shrink-0 items-center gap-0.5 pl-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCreate}
              disabled={disabled}
              aria-label="New profile"
              title="New profile"
            >
              <Plus />
            </Button>

            {/* Non-modal: a modal menu that opens the delete AlertDialog can
                leave `pointer-events: none` stuck on <body>. */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled || !activeProfile}
                  aria-label="Profile actions"
                  title="Profile actions"
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                onCloseAutoFocus={e => {
                  if (keepFocusOnCloseRef.current) {
                    e.preventDefault();
                    keepFocusOnCloseRef.current = false;
                  }
                }}
              >
                <DropdownMenuItem
                  onSelect={() => {
                    if (!activeProfile) return;
                    keepFocusOnCloseRef.current = true;
                    startRename(activeProfile.id, activeProfile.name);
                  }}
                >
                  <Pencil />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    activeProfile && onDuplicate(activeProfile.id)
                  }
                >
                  <Copy />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={profiles.length === 1}
                  onSelect={() =>
                    activeProfile && setPendingDeleteId(activeProfile.id)
                  }
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Tabs>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={open => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete profile</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{' '}
              <span className="font-semibold">{pendingDelete?.name}</span> and
              its {pendingDelete ? countEntries(pendingDelete) : 0} saved
              worklog
              {pendingDelete && countEntries(pendingDelete) === 1 ? '' : 's'}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete.id);
                setPendingDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
