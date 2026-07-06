'use client';

import { useCallback, useState } from 'react';

import { ChevronRight } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { cn } from '@workspace/ui/lib/utils';

import { AuditFilters } from '@/components/features/audit/audit-filters';
import { useSystemLogs, type LogEntry } from '@/hooks/use-system-logs';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  return d;
}

// Shared grid template so the header and every row stay column-aligned.
const GRID_COLS =
  'grid-cols-[148px_92px_116px_minmax(150px,1fr)_78px_96px_96px_138px_minmax(180px,1.2fr)_26px]';

// Literal class strings so Tailwind's JIT compiler picks them up.
const LEVEL_STYLES: Record<string, { badge: string; dot: string }> = {
  INFO: { badge: 'bg-banner-info-bg text-banner-info-fg', dot: 'bg-banner-info-fg' },
  WARN: { badge: 'bg-banner-warning-bg text-banner-warning-fg', dot: 'bg-banner-warning-fg' },
  ERROR: { badge: 'bg-banner-error-bg text-banner-error-fg', dot: 'bg-banner-error-fg' },
};

function levelStyle(level: string) {
  return LEVEL_STYLES[level] ?? LEVEL_STYLES.INFO;
}

function statusClass(status?: number) {
  if (!status) return 'text-muted-foreground';
  if (status < 300) return 'text-alert-success-text';
  if (status < 500) return 'text-alert-warning-text';
  return 'text-alert-error-text';
}

function durationClass(duration?: number) {
  if (duration == null) return 'bg-muted text-muted-foreground';
  if (duration > 2000) return 'bg-banner-error-bg text-banner-error-fg';
  if (duration > 900) return 'bg-banner-warning-bg text-banner-warning-fg';
  return 'bg-muted text-muted-foreground';
}

function shortUrl(url?: string) {
  if (!url) return '—';
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length <= 2) return u.host + u.pathname;
    return `${u.host}/…/${parts.slice(-2).join('/')}`;
  } catch {
    return url;
  }
}

function clockOf(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function formatTimestamp(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function statusMessage(status?: number) {
  if (!status) return 'Request recorded.';
  if (status < 300) return 'Request completed successfully.';
  if (status < 500) return 'Completed with a client warning.';
  return 'Request failed — upstream error.';
}

function rawLog(row: LogEntry) {
  return JSON.stringify(
    {
      timestamp: row.timestamp,
      level: row.level,
      event: row.event ?? null,
      operation: row.operation ?? null,
      method: row.method ?? null,
      status: row.status ?? null,
      durationMs: row.duration ?? null,
      username: row.username || null,
      issueKey: row.issueKey || null,
      url: row.url ?? null,
      requestId: row.reqId ?? null,
    },
    null,
    2,
  );
}

function LevelBadge({ level }: { level: string }) {
  const s = levelStyle(level);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-0.5 pl-2 pr-2.5 text-[11px] font-bold tracking-wide',
        s.badge,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {level}
    </span>
  );
}

export function AuditTable() {
  const [from, setFrom] = useState<Date>(startOfToday());
  const [to, setTo] = useState<Date>(endOfToday());
  const [level, setLevel] = useState('all');
  const [event, setEvent] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LogEntry | null>(null);

  const { items, loading, error, fetchLogs } = useSystemLogs();

  const runSearch = useCallback(
    (overrides?: { level?: string; event?: string }) => {
      const nextLevel = overrides?.level ?? level;
      const nextEvent = overrides?.event ?? event;
      fetchLogs({
        from: from.toISOString(),
        to: to.toISOString(),
        level: nextLevel === 'all' ? undefined : nextLevel,
        event: nextEvent === 'all' ? undefined : nextEvent,
        search: search || undefined,
      });
    },
    [from, to, level, event, search, fetchLogs],
  );

  const handleLevelChange = useCallback(
    (next: string) => {
      setLevel(next);
      runSearch({ level: next });
    },
    [runSearch],
  );

  const handleEventChange = useCallback(
    (next: string) => {
      setEvent(next);
      runSearch({ event: next });
    },
    [runSearch],
  );

  return (
    <div className="flex flex-col gap-4">
      <AuditFilters
        from={from}
        to={to}
        onRangeChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
        level={level}
        onLevelChange={handleLevelChange}
        event={event}
        onEventChange={handleEventChange}
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={() => runSearch()}
        showSearchButton
        submitting={loading}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Result meta */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          Showing{' '}
          <span className="text-foreground font-semibold">{items.length}</span>{' '}
          events
        </div>
        <div className="text-muted-foreground flex items-center gap-3.5 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-banner-info-fg size-[7px] rounded-full" />
            Info
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-banner-warning-fg size-[7px] rounded-full" />
            Warn
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-banner-error-fg size-[7px] rounded-full" />
            Error
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {/* Header row */}
        <div
          className={cn(
            'bg-muted/40 text-muted-foreground grid gap-4 border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-wide',
            GRID_COLS,
          )}
        >
          <div>Time</div>
          <div>Level</div>
          <div>Event</div>
          <div>Operation</div>
          <div>Status</div>
          <div>Duration</div>
          <div>User</div>
          <div>Issue Key</div>
          <div>Endpoint</div>
          <div />
        </div>

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn('grid items-center gap-4 border-b px-4 py-3.5', GRID_COLS)}
            >
              {Array.from({ length: 10 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="text-muted-foreground px-8 py-16 text-center text-sm">
            {error
              ? 'Query failed.'
              : 'No audit logs found. Try adjusting the filters and clicking Search.'}
          </div>
        ) : (
          items.map((row, i) => (
            <button
              key={row.reqId ?? i}
              type="button"
              onClick={() => setSelected(row)}
              className={cn(
                'group hover:bg-muted/40 grid w-full items-center gap-4 border-b px-4 py-3.5 text-left transition-colors',
                GRID_COLS,
              )}
            >
              <div className="text-foreground/70 text-xs">
                {clockOf(row.timestamp)}
              </div>
              <div>
                <LevelBadge level={row.level} />
              </div>
              <div className="min-w-0">
                <span className="bg-muted text-muted-foreground inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold">
                  {row.event ?? '—'}
                </span>
              </div>
              <div className="text-foreground truncate text-sm font-medium">
                {row.operation ?? '—'}
              </div>
              <div
                className={cn('font-mono text-[13px] font-bold', statusClass(row.status))}
              >
                {row.status ?? '—'}
              </div>
              <div>
                <span
                  className={cn(
                    'inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold',
                    durationClass(row.duration),
                  )}
                >
                  {row.duration != null ? `${row.duration}ms` : '—'}
                </span>
              </div>
              <div className="text-foreground/70 truncate text-[13px]">
                {row.username || '—'}
              </div>
              <div className="text-foreground/70 truncate text-xs">
                {row.issueKey || '–'}
              </div>
              <div
                title={row.url}
                className="text-muted-foreground truncate text-[11.5px]"
              >
                {shortUrl(row.url)}
              </div>
              <div className="opacity-0 transition-opacity group-hover:opacity-100">
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent
          side="right"
          className="w-[460px] gap-0 overflow-y-auto sm:max-w-[460px]"
        >
          {selected && (
            <div className="p-6 md:p-7">
              <SheetHeader className="mb-5 flex-row items-center gap-2.5 p-0">
                <LevelBadge level={selected.level} />
                <span
                  className={cn(
                    'font-mono text-[13px] font-bold',
                    statusClass(selected.status),
                  )}
                >
                  {selected.status ?? '—'}
                </span>
              </SheetHeader>

              <SheetTitle className="text-foreground text-[22px] font-bold tracking-tight">
                {selected.operation ?? 'Event'}
              </SheetTitle>
              <SheetDescription className="mb-6 mt-1">
                {selected.message || statusMessage(selected.status)}
              </SheetDescription>

              <dl className="mb-5 flex flex-col overflow-hidden rounded-xl border">
                <DetailRow label="Timestamp" value={formatTimestamp(selected.timestamp)} />
                <DetailRow label="Event" value={selected.event ?? '—'} />
                <DetailRow label="Method" value={selected.method ?? '—'} />
                <DetailRow
                  label="Duration"
                  value={selected.duration != null ? `${selected.duration}ms` : '—'}
                />
                <DetailRow label="Username" value={selected.username || '—'} />
                <DetailRow label="Issue Key" value={selected.issueKey || '—'} last />
              </dl>

              <div className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wide">
                Endpoint
              </div>
              <div className="bg-muted mb-5 rounded-xl border p-3">
                <span className="text-foreground break-all text-[12.5px] leading-relaxed">
                  {selected.url ?? '—'}
                </span>
              </div>

              <div className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wide">
                Raw log
              </div>
              <pre className="bg-secondary text-secondary-foreground overflow-x-auto rounded-xl p-4 text-xs leading-relaxed">
                {rawLog(selected)}
              </pre>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3',
        !last && 'border-b',
      )}
    >
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-foreground text-right text-[13px]">{value}</dd>
    </div>
  );
}
