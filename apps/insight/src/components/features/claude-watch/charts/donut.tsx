'use client';

import { Cell, Pie, PieChart } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@workspace/ui/components/chart';

interface DonutProps<T> {
  items: T[];
  value: (item: T) => number;
  color: (item: T, index: number) => string;
  center: string;
  centerLabel?: string;
  size?: number;
  strokeWidth?: number;
}

export function Donut<T>({
  items,
  value,
  color,
  center,
  centerLabel = 'Total',
  size = 190,
  strokeWidth = 20,
}: DonutProps<T>) {
  const chartData = items.map((it, i) => ({
    name: `item-${i}`,
    value: value(it),
    fill: color(it, i),
  }));

  const config: ChartConfig = Object.fromEntries(
    chartData.map(d => [d.name, { color: d.fill }])
  );

  // Match the original SVG geometry: r = size/2 - 14, stroke centered on r
  const r = size / 2 - 14;
  const outerRadius = r + strokeWidth / 2;
  const innerRadius = r - strokeWidth / 2;

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <ChartContainer
        config={config}
        className="aspect-auto"
        style={{ width: '100%', height: '100%' }}
      >
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                nameKey="name"
                formatter={(val, _name, item) => [
                  String(val),
                  item.payload?.name ?? '',
                ]}
              />
            }
          />
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-muted-foreground text-[10.5px] uppercase tracking-wide">
          {centerLabel}
        </div>
        <div className="font-mono text-lg font-bold">{center}</div>
      </div>
    </div>
  );
}
