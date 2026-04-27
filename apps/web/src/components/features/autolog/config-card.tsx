'use client';

import { Calendar, Clock } from 'lucide-react';

import { Badge } from '@workspace/ui/components/badge';
import { Card } from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';
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

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatLastRunDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function ConfigCard({ config, onClick }: ConfigCardProps) {
  const totalHours = config.tickets.reduce((sum, t) => sum + t.hours, 0);
  const isActive = config.status === 'active';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-muted/50 overflow-hidden py-0 gap-0',
        isActive && 'border-l-[3px] border-l-green-500'
      )}
      onClick={() => onClick(config)}
    >
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm leading-tight">{config.projectName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{config.projectKey}</p>
          </div>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className="text-[10px] uppercase tracking-wide shrink-0"
          >
            {isActive ? 'Active' : 'Paused'}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {formatSchedule(config)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {totalHours}h total
          </span>
        </div>
      </div>

      <div className="bg-muted/50 border-t px-4 py-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="uppercase tracking-widest font-medium text-[10px]">Last Run</span>
        {config.lastRunAt ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
            <span>
              {formatLastRunDate(config.lastRunAt)}
              {config.lastRunDurationMs !== undefined && (
                <> &middot; {formatDuration(config.lastRunDurationMs)}</>
              )}
            </span>
          </>
        ) : (
          <span>No runs yet</span>
        )}
      </div>
    </Card>
  );
}
