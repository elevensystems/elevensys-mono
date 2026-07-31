'use client';

import { Badge } from '@workspace/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { cn } from '@workspace/ui/lib/utils';
import { Calendar, Clock } from 'lucide-react';

import type { AutologConfig } from '@/types/autolog';
import { DAY_NAMES } from '@/types/autolog';

interface ConfigCardProps {
  config: AutologConfig;
  onClick: (config: AutologConfig) => void;
}

export const STATUS_LABELS: Record<AutologConfig['status'], string> = {
  active: 'Active',
  paused_auth: 'Paused — Re-auth required',
};

export const RUN_STATUS_CONFIG: Record<
  NonNullable<AutologConfig['lastRunStatus']>,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  success: { label: 'Success', variant: 'default' },
  partial: { label: 'Partial', variant: 'secondary' },
  nothing_to_log: { label: 'Nothing to log', variant: 'outline' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export function formatSchedule(config: AutologConfig): string {
  const { schedule } = config;
  const hourStr = `${String(schedule.hour).padStart(2, '0')}:00 UTC`;
  if (schedule.type === 'weekly') {
    return `Every ${DAY_NAMES[schedule.dayOfWeek ?? 5]} at ${hourStr}`;
  }
  const day = schedule.dayOfMonth ?? 1;
  const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
  return `Monthly on the ${day}${suffix} at ${hourStr}`;
}

export function ConfigCard({ config, onClick }: ConfigCardProps) {
  const totalHours = config.tickets.reduce((sum, t) => sum + t.hours, 0);
  const isPaused = config.status === 'paused_auth';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-muted/50 py-0 gap-2',
        isPaused && 'border-destructive/30'
      )}
      onClick={() => onClick(config)}
    >
      <CardHeader className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{config.projectName}</CardTitle>
            <CardDescription className="text-xs">
              {config.projectKey}
            </CardDescription>
          </div>
          <Badge variant={isPaused ? 'destructive' : 'default'}>
            {STATUS_LABELS[config.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-5 pb-5 pt-0">
        <Separator />

        {/* Schedule */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{formatSchedule(config)}</span>
          </div>
          <p className="pl-[1.375rem] text-xs text-muted-foreground">
            {totalHours}h total
          </p>
        </div>

        <Separator />

        {/* Last run */}
        {config.lastRunAt ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {new Date(config.lastRunAt).toLocaleString()}
            </span>
            {config.lastRunStatus && (
              <Badge
                variant={RUN_STATUS_CONFIG[config.lastRunStatus].variant}
                className="ml-auto shrink-0 py-0"
              >
                {RUN_STATUS_CONFIG[config.lastRunStatus].label}
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>No runs yet</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
