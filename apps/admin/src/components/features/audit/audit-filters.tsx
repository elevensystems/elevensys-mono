'use client';

import { useCallback } from 'react';

import { Search } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import { DateTimeRangePicker } from '@workspace/ui/components/date-time-range-picker';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { cn } from '@workspace/ui/lib/utils';

export const KNOWN_EVENTS = ['JIRA_PROXY', 'JIRA_PROXY_ERROR'];

export const LEVEL_SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARN', label: 'Warn' },
  { value: 'ERROR', label: 'Error' },
] as const;

interface AuditFiltersProps {
  from: Date;
  to: Date;
  onRangeChange: (from: Date, to: Date) => void;
  level: string;
  onLevelChange: (level: string) => void;
  event: string;
  onEventChange: (event: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  /** Called on Enter / the Search button (table mode). Omit for auto-refetch (chart mode). */
  onSearchSubmit?: () => void;
  /** Show an explicit Search button (table mode). */
  showSearchButton?: boolean;
  submitting?: boolean;
  /** Earliest selectable date (e.g. log retention window). */
  minDate?: Date;
}

/**
 * Shared audit filter bar: date/time range, event, level segments, and free-text
 * search. Used by both the table (explicit Search button) and the chart
 * (auto-refetch on change).
 */
export function AuditFilters({
  from,
  to,
  onRangeChange,
  level,
  onLevelChange,
  event,
  onEventChange,
  search,
  onSearchChange,
  onSearchSubmit,
  showSearchButton = false,
  submitting = false,
  minDate,
}: AuditFiltersProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') onSearchSubmit?.();
    },
    [onSearchSubmit],
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <DateTimeRangePicker
        id="audit-range"
        from={from}
        to={to}
        minDate={minDate}
        onRangeChange={onRangeChange}
      />

      <Select value={event} onValueChange={onEventChange}>
        <SelectTrigger className="w-auto gap-2">
          <SelectValue placeholder="All events" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All events</SelectItem>
          {KNOWN_EVENTS.map(e => (
            <SelectItem key={e} value={e}>
              {e}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Segmented level control */}
      <div className="bg-muted flex items-center gap-0.5 rounded-[11px] p-[3px]">
        {LEVEL_SEGMENTS.map(seg => {
          const active = level === seg.value;
          return (
            <button
              key={seg.value}
              type="button"
              onClick={() => onLevelChange(seg.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {seg.label}
            </button>
          );
        })}
      </div>

      <div className="relative min-w-[200px] flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-[15px] -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder="Search operation, user, issue, URL…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showSearchButton && (
        <Button onClick={onSearchSubmit} disabled={submitting}>
          <Search className="size-4" />
          Search
        </Button>
      )}
    </div>
  );
}
