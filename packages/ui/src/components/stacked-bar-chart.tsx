'use client';

import type * as React from 'react';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@workspace/ui/components/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

export interface StackedBarSeries {
  /** Data key present on each datum (e.g. "INFO"). */
  key: string;
  /** Human label shown in the tooltip/legend. */
  label: string;
  /** Bar fill color (any CSS color). */
  color: string;
}

export interface StackedBarDatum {
  /** Stable identity for the bucket (e.g. an ISO timestamp); passed to onBarClick. */
  bucket: string;
  [seriesKey: string]: string | number;
}

interface StackedBarChartProps {
  data: StackedBarDatum[];
  series: StackedBarSeries[];
  /** Format a bucket identity into an axis/tooltip label (e.g. localize a UTC timestamp). */
  xLabelFormat: (bucket: string) => string;
  height?: number;
  onBarClick?: (bucket: string) => void;
  emptyMessage?: string;
}

/**
 * Generic stacked bar chart over the shared recharts primitives. Presentational:
 * the caller supplies series keys, colors, and x-axis label formatting, so it
 * stays reusable across apps (audit levels, usage dimensions, etc.).
 */
export function StackedBarChart({
  data,
  series,
  xLabelFormat,
  height = 260,
  onBarClick,
  emptyMessage = 'No data in range',
}: StackedBarChartProps) {
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

  // Derive the exact onClick type from recharts so it stays version-proof.
  type BarChartClick = NonNullable<
    React.ComponentProps<typeof BarChart>['onClick']
  >;
  const handleClick: BarChartClick | undefined = onBarClick
    ? state => {
        // recharts reports the clicked category via activeTooltipIndex.
        const idx = state?.activeTooltipIndex ?? state?.activeIndex;
        const i = typeof idx === 'number' ? idx : Number(idx);
        const bucket = Number.isInteger(i) ? chartData[i]?.bucket : undefined;
        if (bucket) onBarClick(bucket);
      }
    : undefined;

  return (
    <ChartContainer config={config} className="aspect-auto" style={{ height }}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
        onClick={handleClick}
        className={onBarClick ? 'cursor-pointer' : undefined}
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
          allowDecimals={false}
          tick={{ fontSize: 10 }}
          width={40}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="v"
            fill={s.color}
            // Round only the top-most segment so the stack reads as one bar.
            radius={i === series.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
