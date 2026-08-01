'use client';

import { useCallback, useMemo, useState } from 'react';

import { RankedBarChart } from '@workspace/ui/components/ranked-bar-chart';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
  StackedBarChart,
  type StackedBarDatum,
  type StackedBarSeries,
} from '@workspace/ui/components/stacked-bar-chart';
import {
  TimeSeriesLineChart,
  type TimeSeriesLineDatum,
  type TimeSeriesLineSeries,
} from '@workspace/ui/components/time-series-line-chart';

import { AuditFilters } from '@/components/features/audit/audit-filters';
import {
  useAuditLatencyStats,
  useAuditStats,
  useAuditStatusStats,
  useAuditTopEvents,
} from '@/hooks/use-audit-stats';

const CHART_HEIGHT = 300;
const HALF_CHART_HEIGHT = 240;

const RETENTION_DAYS = 30;
const DEFAULT_RANGE_DAYS = 7;

// Bucket sizes returned by the backend, in milliseconds. Buckets are UTC-aligned
// to these multiples (matching CloudWatch's `bin()`), so we can floor to align.
const INTERVAL_MS: Record<string, number> = {
  '1h': 3_600_000,
  '6h': 21_600_000,
  '1d': 86_400_000,
};

const LEVEL_SERIES: StackedBarSeries[] = [
  { key: 'INFO', label: 'Info', color: 'var(--info)' },
  { key: 'WARN', label: 'Warn', color: 'var(--warning)' },
  { key: 'ERROR', label: 'Error', color: 'var(--destructive)' },
];

const STATUS_SERIES: StackedBarSeries[] = [
  { key: 's2xx', label: '2xx', color: 'var(--success)' },
  { key: 's3xx', label: '3xx', color: 'var(--info)' },
  { key: 's4xx', label: '4xx', color: 'var(--warning)' },
  { key: 's5xx', label: '5xx', color: 'var(--destructive)' },
];

const LATENCY_SERIES: TimeSeriesLineSeries[] = [
  { key: 'avg', label: 'Avg', color: 'var(--chart-2)' },
  { key: 'p95', label: 'p95', color: 'var(--chart-1)' },
];

function startOfDay(d: Date) {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function defaultRange() {
  const to = new Date();
  to.setHours(23, 59, 59, 0);
  const from = startOfDay(new Date());
  from.setDate(from.getDate() - (DEFAULT_RANGE_DAYS - 1));
  return { from, to };
}

/** Earliest selectable instant — beyond CloudWatch retention there are no logs. */
function retentionMin() {
  const min = startOfDay(new Date());
  min.setDate(min.getDate() - RETENTION_DAYS);
  return min;
}

/**
 * Zero-fill the continuous, UTC-aligned time axis so quiet periods render as
 * empty buckets rather than collapsing the axis. `make` decides what an empty
 * bucket looks like (0 for counts, null for latency samples).
 */
function fillTimeAxis<B extends { bucket: string }, D>(
  buckets: B[],
  interval: string,
  from: Date,
  to: Date,
  make: (bucket: string, existing: B | undefined) => D
): D[] {
  const step = INTERVAL_MS[interval] ?? INTERVAL_MS['1h'];
  const startMs = Math.floor(from.getTime() / step) * step;
  const endMs = to.getTime();
  const byMs = new Map(buckets.map(b => [Date.parse(b.bucket), b]));

  const filled: D[] = [];
  // Cap the loop so a bad interval/range can't spin (a month of hourly ≈ 744).
  for (
    let t = startMs, guard = 0;
    t <= endMs && guard < 2000;
    t += step, guard++
  ) {
    const existing = byMs.get(t);
    filled.push(make(existing?.bucket ?? new Date(t).toISOString(), existing));
  }
  return filled;
}

function formatMs(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`;
}

export function AuditChart() {
  const initial = useMemo(() => defaultRange(), []);
  const minDate = useMemo(() => retentionMin(), []);

  const [from, setFrom] = useState<Date>(initial.from);
  const [to, setTo] = useState<Date>(initial.to);
  const [level, setLevel] = useState('all');
  const [event, setEvent] = useState('all');
  const [search, setSearch] = useState('');

  const params = {
    from: from.toISOString(),
    to: to.toISOString(),
    level: level === 'all' ? undefined : level,
    event: event === 'all' ? undefined : event,
    search,
  };

  const volume = useAuditStats(params);
  const latency = useAuditLatencyStats(params);
  const status = useAuditStatusStats(params);
  const events = useAuditTopEvents(params);

  const handleRangeChange = useCallback(
    (f: Date, t: Date) => {
      // Retention guard: never query older than the retention window.
      setFrom(f < minDate ? new Date(minDate) : f);
      setTo(t);
    },
    [minDate]
  );

  const volumeData = useMemo<StackedBarDatum[]>(
    () =>
      fillTimeAxis(volume.buckets, volume.interval, from, to, (bucket, b) => ({
        bucket,
        INFO: b?.INFO ?? 0,
        WARN: b?.WARN ?? 0,
        ERROR: b?.ERROR ?? 0,
      })),
    [volume.buckets, volume.interval, from, to]
  );

  // Latency gaps stay `null`: an empty bucket means "no samples", not 0 ms.
  const latencyData = useMemo<TimeSeriesLineDatum[]>(() => {
    const res = latency.data;
    if (!res) return [];
    return fillTimeAxis(res.buckets, res.interval, from, to, (bucket, b) => ({
      bucket,
      avg: b ? Math.round(b.avg) : null,
      p95: b ? Math.round(b.p95) : null,
    }));
  }, [latency.data, from, to]);

  const statusData = useMemo<StackedBarDatum[]>(() => {
    const res = status.data;
    if (!res) return [];
    return fillTimeAxis(res.buckets, res.interval, from, to, (bucket, b) => ({
      bucket,
      s2xx: b?.s2xx ?? 0,
      s3xx: b?.s3xx ?? 0,
      s4xx: b?.s4xx ?? 0,
      s5xx: b?.s5xx ?? 0,
    }));
  }, [status.data, from, to]);

  const eventsData = useMemo(
    () =>
      (events.data?.items ?? []).map(i => ({ label: i.event, value: i.count })),
    [events.data]
  );

  // Headline stats for the KPI cards. Derived from the raw buckets (not the
  // zero-filled axis) so counts and the peak reflect real activity only.
  const volumeStats = useMemo(() => {
    let total = 0;
    let errors = 0;
    let peak: { bucket: string; count: number } | null = null;

    for (const b of volume.buckets) {
      const count = b.INFO + b.WARN + b.ERROR;
      total += count;
      errors += b.ERROR;
      if (!peak || count > peak.count) peak = { bucket: b.bucket, count };
    }

    return {
      total,
      errors,
      errorRate: total ? (errors / total) * 100 : 0,
      peak,
    };
  }, [volume.buckets]);

  // Overall latency: avg is an exact sample-weighted mean; p95 is a weighted
  // mean of per-bucket p95s — an approximation, flagged with "≈" in the UI.
  const latencyStats = useMemo(() => {
    const buckets = latency.data?.buckets ?? [];
    let samples = 0;
    let avgSum = 0;
    let p95Sum = 0;
    for (const b of buckets) {
      samples += b.count;
      avgSum += b.avg * b.count;
      p95Sum += b.p95 * b.count;
    }
    return samples
      ? { avg: avgSum / samples, p95: p95Sum / samples }
      : { avg: null, p95: null };
  }, [latency.data]);

  // `|| 0` guards the deploy window where the API doesn't return status
  // buckets yet (old backend) — without it the card renders NaN.
  const serverErrors = useMemo(
    () =>
      (status.data?.buckets ?? []).reduce((sum, b) => sum + (b.s5xx || 0), 0),
    [status.data]
  );

  const xLabelFormat = useCallback(
    (bucket: string) => {
      const interval = volume.interval;
      const d = new Date(bucket);
      if (interval === '1d') {
        return d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
      }
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
      });
    },
    [volume.interval]
  );

  const error = volume.error || latency.error || status.error || events.error;

  return (
    <div className="flex flex-col gap-4">
      <AuditFilters
        from={from}
        to={to}
        onRangeChange={handleRangeChange}
        level={level}
        onLevelChange={setLevel}
        event={event}
        onEventChange={setEvent}
        search={search}
        onSearchChange={setSearch}
        minDate={minDate}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total events"
          value={volume.loading ? null : volumeStats.total.toLocaleString()}
        />
        <StatCard
          label="Errors"
          value={volume.loading ? null : volumeStats.errors.toLocaleString()}
          accent="var(--destructive)"
        />
        <StatCard
          label="Error rate"
          value={volume.loading ? null : `${volumeStats.errorRate.toFixed(1)}%`}
          accent={volumeStats.errorRate > 0 ? 'var(--destructive)' : undefined}
        />
        <StatCard
          label="Avg latency"
          value={
            latency.loading
              ? null
              : latencyStats.avg === null
                ? '—'
                : formatMs(latencyStats.avg)
          }
          accent="var(--chart-2)"
        />
        <StatCard
          label="p95 latency"
          value={
            latency.loading
              ? null
              : latencyStats.p95 === null
                ? '—'
                : `≈ ${formatMs(latencyStats.p95)}`
          }
          accent="var(--chart-1)"
          hint="weighted across buckets"
        />
        <StatCard
          label="5xx responses"
          value={status.loading ? null : serverErrors.toLocaleString()}
          accent={serverErrors > 0 ? 'var(--destructive)' : undefined}
        />
      </div>

      {/* Log volume */}
      <ChartCard
        title="Log volume"
        series={LEVEL_SERIES}
        hint={
          volume.loading || !volumeStats.peak
            ? undefined
            : `Peak ${volumeStats.peak.count.toLocaleString()} · ${xLabelFormat(volumeStats.peak.bucket)}`
        }
        loading={volume.loading}
        height={CHART_HEIGHT}
      >
        <StackedBarChart
          data={volumeData}
          series={LEVEL_SERIES}
          xLabelFormat={xLabelFormat}
          height={CHART_HEIGHT}
        />
        {volumeStats.total === 0 && <EmptyOverlay />}
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Latency */}
        <ChartCard
          title="Latency"
          series={LATENCY_SERIES}
          loading={latency.loading}
          height={HALF_CHART_HEIGHT}
        >
          <TimeSeriesLineChart
            data={latencyData}
            series={LATENCY_SERIES}
            xLabelFormat={xLabelFormat}
            yTickFormat={formatMs}
            height={HALF_CHART_HEIGHT}
          />
          {(latency.data?.buckets.length ?? 0) === 0 && <EmptyOverlay />}
        </ChartCard>

        {/* HTTP status classes */}
        <ChartCard
          title="HTTP status"
          series={STATUS_SERIES}
          loading={status.loading}
          height={HALF_CHART_HEIGHT}
        >
          <StackedBarChart
            data={statusData}
            series={STATUS_SERIES}
            xLabelFormat={xLabelFormat}
            height={HALF_CHART_HEIGHT}
          />
          {(status.data?.buckets.length ?? 0) === 0 && <EmptyOverlay />}
        </ChartCard>
      </div>

      {/* Top events */}
      <ChartCard title="Top events" loading={events.loading} height={200}>
        <RankedBarChart
          data={eventsData}
          color="var(--chart-1)"
          valueLabel="Events"
          labelWidth={210}
        />
      </ChartCard>

      <p className="text-muted-foreground text-xs">
        Range is limited to the last {RETENTION_DAYS} days of log retention.
      </p>
    </div>
  );
}

function ChartCard({
  title,
  series,
  hint,
  loading,
  height,
  children,
}: {
  title: string;
  series?: { key: string; label: string; color: string }[];
  hint?: string;
  loading: boolean;
  height: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <div className="text-muted-foreground flex items-center gap-3.5 text-xs">
          {hint && <span>{hint}</span>}
          {series?.map(s => (
            <Legend key={s.key} color={s.color} label={s.label} />
          ))}
        </div>
      </div>
      {loading ? (
        <Skeleton style={{ height }} className="w-full" />
      ) : (
        <div className="relative">{children}</div>
      )}
    </div>
  );
}

function EmptyOverlay() {
  return (
    <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
      No logs in this range.
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  /** `null` renders a loading skeleton. */
  value: string | null;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="bg-card flex flex-col gap-1.5 rounded-lg border p-4">
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
        {accent && (
          <span
            className="size-[7px] rounded-full"
            style={{ backgroundColor: accent }}
          />
        )}
        {label}
      </span>
      {value === null ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <span className="text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </span>
      )}
      {hint && value !== null && (
        <span className="text-muted-foreground truncate text-xs">{hint}</span>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-[7px] rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
