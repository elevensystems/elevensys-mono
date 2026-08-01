'use client';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@workspace/ui/components/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

export interface TimeSeriesLineSeries {
  /** Data key present on each datum (e.g. "avg"). */
  key: string;
  /** Human label shown in the tooltip/legend. */
  label: string;
  /** Line stroke color (any CSS color). */
  color: string;
}

export interface TimeSeriesLineDatum {
  /** Stable identity for the bucket (e.g. an ISO timestamp). */
  bucket: string;
  /** `null` marks a bucket with no samples — rendered as a gap, not zero. */
  [seriesKey: string]: string | number | null;
}

interface TimeSeriesLineChartProps {
  data: TimeSeriesLineDatum[];
  series: TimeSeriesLineSeries[];
  /** Format a bucket identity into an axis/tooltip label (e.g. localize a UTC timestamp). */
  xLabelFormat: (bucket: string) => string;
  /** Format a y-axis tick (e.g. append "ms"). */
  yTickFormat?: (value: number) => string;
  height?: number;
  emptyMessage?: string;
}

/**
 * Generic multi-line time-series chart over the shared recharts primitives.
 * Presentational: the caller supplies series keys, colors, and formatting.
 * Missing values must be `null` (not 0) — they render as gaps, which is the
 * honest encoding for "no samples in this bucket".
 */
export function TimeSeriesLineChart({
  data,
  series,
  xLabelFormat,
  yTickFormat,
  height = 260,
  emptyMessage = 'No data in range',
}: TimeSeriesLineChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="text-muted-foreground flex items-center justify-center text-sm"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const config: ChartConfig = Object.fromEntries(
    series.map(s => [s.key, { label: s.label, color: s.color }])
  );

  const chartData = data.map(d => ({ ...d, _x: xLabelFormat(d.bucket) }));

  const tickInterval =
    data.length > 12 ? Math.floor(data.length / 8) : 'preserveStartEnd';

  return (
    <ChartContainer config={config} className="aspect-auto" style={{ height }}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="_x"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={tickInterval}
          tick={{ fontSize: 10.5 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
          width={48}
          tickFormatter={yTickFormat}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map(s => (
          <Line
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={s.color}
            strokeWidth={2}
            // Small always-on dots so an isolated bucket (gaps on both sides)
            // is still visible — a line segment needs two adjacent points.
            dot={{ r: 2, fill: s.color, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
