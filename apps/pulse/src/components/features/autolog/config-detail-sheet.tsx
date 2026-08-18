'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet';
import { useIsMobile } from '@workspace/ui/hooks/use-mobile';
import { cn } from '@workspace/ui/lib/utils';
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Loader2,
  Minus,
  Pencil,
  Play,
  Trash2,
  X,
} from 'lucide-react';

import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import type {
  AutologConfig,
  AutologRunResult,
  AutologTicket,
} from '@/types/autolog';
import { formatNextRun } from '@/types/autolog';

import {
  RUN_STATUS_CONFIG,
  STATUS_LABELS,
  formatSchedule,
} from './config-card';

interface ConfigDetailSheetProps {
  config: AutologConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (configId: string) => Promise<boolean>;
  onRun: (configId: string) => Promise<boolean>;
}

function TicketRow({
  ticket,
  result,
}: {
  ticket: AutologTicket;
  result?: AutologRunResult;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMessage = result && result.status !== 'logged' && result.message;

  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between py-1 text-sm',
          hasMessage && 'cursor-pointer'
        )}
        onClick={() => hasMessage && setExpanded(e => !e)}
      >
        <span className="font-mono text-xs">{ticket.issueKey}</span>
        <div className="flex items-center gap-2">
          {result &&
            (result.status === 'logged' ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : result.status === 'skipped' ? (
              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <X className="h-3.5 w-3.5 text-destructive" />
            ))}
          <span className="text-muted-foreground">{ticket.hours}h</span>
        </div>
      </div>
      {expanded && hasMessage && (
        <p className="pb-1 text-xs text-muted-foreground">{result.message}</p>
      )}
    </div>
  );
}

export function ConfigDetailSheet({
  config,
  open,
  onOpenChange,
  onDelete,
  onRun,
}: ConfigDetailSheetProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isRunning, setIsRunning] = useState(false);
  const [runSuccess, setRunSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!config) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setRunSuccess(false);
    const ok = await onRun(config.configId);
    setIsRunning(false);
    if (ok) {
      setRunSuccess(true);
      setTimeout(() => setRunSuccess(false), 2000);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const ok = await onDelete(config.configId);
    setIsDeleting(false);
    if (ok) {
      setShowDeleteDialog(false);
      onOpenChange(false);
    }
  };

  const handleEdit = () => {
    onOpenChange(false);
    router.push(`/autolog/${config.configId}/edit`);
  };

  const totalHours = config.tickets.reduce((sum, t) => sum + t.hours, 0);
  const nextRun = formatNextRun(config.schedule);
  const isRetrying = (config.schedule.attempt ?? 0) > 0;
  const resultsMap = new Map(
    config.lastRunResults?.map(r => [r.issueKey, r]) ?? []
  );
  const loggedCount = config.lastRunResults?.filter(
    r => r.status === 'logged'
  ).length;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          hideCloseButton
          className={
            isMobile
              ? 'max-h-[70vh] overflow-y-auto rounded-t-2xl'
              : 'overflow-y-auto sm:max-w-md'
          }
        >
          <SheetHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <SheetTitle>{config.projectName}</SheetTitle>
                <SheetDescription>{config.projectKey}</SheetDescription>
              </div>
              <Badge
                variant={config.status === 'active' ? 'default' : 'destructive'}
              >
                {STATUS_LABELS[config.status]}
              </Badge>
            </div>
          </SheetHeader>

          <div className="space-y-5 px-4 py-4">
            {/* Schedule section */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{formatSchedule(config)}</span>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                Covers {config.coveragePeriod.start} –{' '}
                {config.coveragePeriod.end}
              </p>
              {nextRun && (
                <p className="pl-6 text-xs text-muted-foreground">
                  Next run: {nextRun}
                </p>
              )}
              {isRetrying && (
                <p className="pl-6 text-xs text-amber-600 dark:text-amber-500">
                  Jira was unreachable — retrying (attempt{' '}
                  {config.schedule.attempt}). Nothing has been logged yet.
                </p>
              )}
            </div>

            <Separator />

            {/* Tickets section */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Tickets ({config.tickets.length}) &middot; {totalHours}h total
              </p>
              <div className="divide-y rounded-md border px-3">
                {config.tickets.map(t => (
                  <TicketRow
                    key={t.issueKey}
                    ticket={t}
                    result={resultsMap.get(t.issueKey)}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Last run section */}
            {config.lastRunAt ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Last run: {new Date(config.lastRunAt).toLocaleString()}
                  </span>
                  {config.lastRunStatus && (
                    <Badge
                      variant={RUN_STATUS_CONFIG[config.lastRunStatus].variant}
                      className="ml-auto py-0"
                    >
                      {RUN_STATUS_CONFIG[config.lastRunStatus].label}
                    </Badge>
                  )}
                </div>
                {config.lastRunStatus === 'partial' &&
                  loggedCount !== undefined && (
                    <p className="pl-[1.375rem] text-xs text-muted-foreground">
                      {loggedCount}/{config.tickets.length} tickets logged
                    </p>
                  )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>No runs yet</span>
              </div>
            )}

            {/* Re-auth warning */}
            {config.status === 'paused_auth' && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Jira token expired. Update your token to resume autolog.
                </span>
              </div>
            )}
          </div>

          <SheetFooter className="flex-row gap-2 border-t px-4 pt-4">
            {config.status === 'paused_auth' ? (
              <Button className="flex-1" onClick={handleEdit}>
                Re-authenticate
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={handleRun}
                disabled={isRunning || runSuccess}
              >
                {isRunning ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : runSuccess ? (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isRunning ? 'Running...' : runSuccess ? 'Done' : 'Run Now'}
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={handleEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog
        title="Delete configuration?"
        description={
          <>
            This will permanently delete the autolog configuration for{' '}
            <strong>{config.projectName}</strong>. This action cannot be undone.
          </>
        }
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
