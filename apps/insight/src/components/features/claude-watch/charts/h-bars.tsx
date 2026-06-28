'use client';

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@workspace/ui/components/chart';

interface HBarsProps<T> {
  items: T[];
  value: (item: T) => number;
  label: (item: T) => string;
  fmt: (item: T) => string;
  color?: (item: T, index: number) => string;
  max?: number;
  monoLabel?: boolean;
  gap?: number;
}

const LABEL_WIDTH = 140;
const BAR_HEIGHT = 22;
const BAR_GAP = 14;

function TruncatedTick({
  x,
  y,
  payload,
  monoLabel,
}: {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
  monoLabel?: boolean;
}) {
  if (x === undefined || y === undefined || !payload) return null;
  const text = payload.value;
  const truncated = text.length > 24 ? `…${text.slice(-22)}` : text;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        dy={4}
        textAnchor="end"
        fontSize={monoLabel ? 11 : 12.5}
        fontFamily={monoLabel ? 'monospace' : undefined}
        className="fill-foreground"
      >
        {truncated}
      </text>
    </g>
  );
}

export function HBars<T>({
  items,
  value,
  label,
  fmt,
  color,
  max,
  monoLabel = false,
}: HBarsProps<T>) {
  if (items.length === 0) return null;

  const scaleMax = max || Math.max(...items.map(value)) || 1;
  const chartData = items.map((it, i) => ({
    name: String(label(it)),
    value: value(it),
    fill: color ? color(it, i) : 'var(--chart-1)',
    fmt: fmt(it),
  }));

  const config: ChartConfig = { value: { label: 'Value' } };
  const height = items.length * (BAR_HEIGHT + BAR_GAP) + BAR_GAP;

  return (
    <ChartContainer config={config} className="aspect-auto" style={{ height }}>
      <BarChart
        layout="vertical"
        data={chartData}
        barSize={BAR_HEIGHT - 6}
        margin={{ top: 0, right: 4, bottom: 0, left: 4 }}
      >
        <XAxis type="number" domain={[0, scaleMax]} hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={LABEL_WIDTH}
          tick={(props: { x?: number | string; y?: number | string; payload?: { value: string } }) => (
            <TruncatedTick {...props} monoLabel={monoLabel} />
          )}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel indicator="dot" />}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="fmt"
            position="right"
            style={{ fontSize: 11, fontFamily: 'monospace' }}
            className="fill-muted-foreground"
          />
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
