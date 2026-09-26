'use client';

import { useState } from 'react';

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
  Minus,
  Trash2,
  User,
  X,
} from 'lucide-react';

import type {
  AutologConfig,
  AutologRunResult,
  AutologTicket,
} from '@/types/autolog';
import {
  RUN_STATUS_CONFIG,
  STATUS_LABELS,
  STATUS_VARIANTS,
  formatNextRun,
  formatSchedule,
  totalHours,
} from '@/types/autolog';

interface AutologDetailSheetProps {
  config: AutologConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hands the config back up; the table owns the confirm dialog and the call. */
  onRequestDelete: (config: AutologConfig) => void;
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
          'flex items-center justify-between py-1.5 text-sm',
          hasMessage && 'cursor-pointer'
        )}
        onClick={() => hasMessage && setExpanded(e => !e)}
      >
        <div className="min-w-0">
          <span className="font-mono text-xs">{ticket.issueKey}</span>
          {ticket.typeOfWork && (
            <span className="text-muted-foreground ml-2 text-xs">
              {ticket.typeOfWork}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {result &&
            (result.status === 'logged' ? (
              <Check className="text-success size-3.5" />
            ) : result.status === 'skipped' ? (
              <Minus className="text-muted-foreground size-3.5" />
            ) : (
              <X className="text-destructive size-3.5" />
            ))}
          <span className="text-muted-foreground">{ticket.hours}h</span>
        </div>
      </div>
      {expanded && hasMessage && (
        <p className="text-muted-foreground pb-1.5 text-xs">{result.message}</p>
      )}
    </div>
  );
}

/**
 * Read-only detail for one configuration. Admin monitors autolog rather than
 * authoring it — editing and "run now" stay in `apps/pulse`, where the config's
 * owner has their own Jira token.
 */
export function AutologDetailSheet({
  config,
  open,
  onOpenChange,
  onRequestDelete,
}: AutologDetailSheetProps) {
  const isMobile = useIsMobile();

  if (!config) return null;

  const nextRun = formatNextRun(config.schedule);
  const isRetrying = (config.schedule?.attempt ?? 0) > 0;
  const resultsMap = new Map(
    config.lastRunResults?.map(r => [r.issueKey, r]) ?? []
  );
  const loggedCount = config.lastRunResults?.filter(
    r => r.status === 'logged'
  ).length;
  const runStatus = config.lastRunStatus
    ? RUN_STATUS_CONFIG[config.lastRunStatus]
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={
          isMobile
            ? 'max-h-[80vh] overflow-y-auto rounded-t-2xl'
            : 'overflow-y-auto sm:max-w-md'
        }
      >
        <SheetHeader>
          <div className="flex items-start justify-between gap-2 pr-6">
            <div className="min-w-0">
              <SheetTitle>{config.projectName}</SheetTitle>
              <SheetDescription>{config.projectKey}</SheetDescription>
            </div>
            <Badge variant={STATUS_VARIANTS[config.status]}>
              {STATUS_LABELS[config.status]}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 py-4">
          {/* Owner — the column admin has that pulse does not. */}
          <div className="flex items-start gap-2 text-sm">
            <User className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
              <div className="font-medium">{config.username}</div>
              <div className="text-muted-foreground text-xs break-all">
                {config.email}
              </div>
              <div className="text-muted-foreground text-xs">
                {config.jiraInstance}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="size-4 shrink-0" />
              <span>{formatSchedule(config)}</span>
            </div>
            {config.coveragePeriod && (
              <p className="text-muted-foreground pl-6 text-xs">
                Covers {config.coveragePeriod.start} –{' '}
                {config.coveragePeriod.end}
              </p>
            )}
            {nextRun && (
              <p className="text-muted-foreground pl-6 text-xs">
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

          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium">
              Tickets ({config.tickets?.length ?? 0}) &middot;{' '}
              {totalHours(config)}h total
            </p>
            <div className="divide-y rounded-md border px-3">
              {config.tickets?.length ? (
                config.tickets.map(t => (
                  <TicketRow
                    key={t.issueKey}
                    ticket={t}
                    result={resultsMap.get(t.issueKey)}
                  />
                ))
              ) : (
                <p className="text-muted-foreground py-2 text-xs">
                  No tickets configured.
                </p>
              )}
            </div>
          </div>

          <Separator />

          {config.lastRunAt ? (
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Clock className="size-3.5 shrink-0" />
                <span>
                  Last run: {new Date(config.lastRunAt).toLocaleString()}
                </span>
                {runStatus && (
                  <Badge variant={runStatus.variant} className="ml-auto py-0">
                    {runStatus.label}
                  </Badge>
                )}
              </div>
              {config.lastRunStatus === 'partial' &&
                loggedCount !== undefined && (
                  <p className="text-muted-foreground pl-[1.375rem] text-xs">
                    {loggedCount}/{config.tickets?.length ?? 0} tickets logged
                  </p>
                )}
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Clock className="size-3.5 shrink-0" />
              <span>No runs yet</span>
            </div>
          )}

          {config.status === 'paused_auth' && (
            <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md p-3 text-xs">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                This user&apos;s Jira token expired. They need to update it in
                Pulse before autolog resumes.
              </span>
            </div>
          )}

          <p className="text-muted-foreground text-xs">
            Created {new Date(config.createdAt).toLocaleDateString()} · updated{' '}
            {new Date(config.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <SheetFooter className="border-t px-4 pt-4">
          <Button
            variant="destructive"
            onClick={() => onRequestDelete(config)}
            className="w-full"
          >
            <Trash2 className="size-4" />
            Delete configuration
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
