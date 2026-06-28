'use client';

import { Bar, BarChart, Cell, LabelList, XAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@workspace/ui/components/chart';

interface VBarsProps<T> {
  items: T[];
  value: (item: T) => number;
  color: (item: T, index: number) => string;
  topLabel: (item: T) => string | number;
  label: (item: T) => string;
  title?: (item: T) => string;
  height?: number;
  gap?: number;
}

export function VBars<T>({
  items,
  value,
  color,
  topLabel,
  label,
  height = 180,
}: VBarsProps<T>) {
  if (items.length === 0) return null;

  const chartData = items.map((it, i) => ({
    name: String(label(it)),
    value: value(it),
    fill: color(it, i),
    topLabel: String(topLabel(it)),
  }));

  const config: ChartConfig = { value: { label: 'Value' } };

  return (
    <ChartContainer config={config} className="aspect-auto" style={{ height }}>
      <BarChart data={chartData} barCategoryGap="25%">
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 10.5 }}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel indicator="dot" />}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="topLabel"
            position="top"
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
