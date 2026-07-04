'use client';

import { CartesianGrid, Line, LineChart as RLineChart, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@workspace/ui/components/chart';

import { COST, PALETTE } from '@/components/features/claude-watch/lib/colors';
import { ft } from '@/components/features/claude-watch/lib/format';

interface LineChartProps<T extends { date: string }> {
  data: T[];
  valueKey: keyof T & string;
  value2Key?: keyof T & string;
  height?: number;
  color?: string;
  color2?: string;
  fmtLeft?: (v: number) => string;
  fmtRight?: (v: number) => string;
}

export function LineChart<T extends { date: string }>({
  data,
  valueKey,
  value2Key,
  height = 230,
  color = COST,
  color2 = PALETTE.blue,
  fmtLeft = v => v.toFixed(1),
  fmtRight = ft,
}: LineChartProps<T>) {
  if (data.length === 0) {
    return (
      <div
        className="text-muted-foreground flex items-center justify-center text-sm"
        style={{ height }}
      >
        No data in range
      </div>
    );
  }

  const chartConfig: ChartConfig = {
    [valueKey]: { label: valueKey, color },
    ...(value2Key ? { [value2Key]: { label: value2Key, color: color2 } } : {}),
  };

  const chartData = data.map(d => {
    const date = new Date(d.date);
    return {
      ...(d as object),
      _xLabel: `${date.getUTCMonth() + 1}/${date.getUTCDate()}`,
    };
  });

  const tickInterval =
    data.length > 12 ? Math.floor(data.length / 6) : 'preserveStartEnd';

  // A line/area needs >=2 points to draw a stroke. With a single point, render
  // a visible filled dot so it reads as an intentional marker, not a glitch.
  const singlePoint = data.length === 1;

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto"
      style={{ height }}
    >
      <RLineChart data={chartData} margin={{ top: 8, right: value2Key ? 8 : 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="_xLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={tickInterval}
          tick={{ fontSize: 10.5 }}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          tickFormatter={fmtLeft}
          tick={{ fontSize: 10 }}
          width={48}
        />
        {value2Key && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtRight}
            tick={{ fontSize: 10 }}
            width={52}
          />
        )}
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey={valueKey as string}
          stroke={color}
          strokeWidth={2}
          dot={singlePoint ? { r: 4, strokeWidth: 0, fill: color } : false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        {value2Key && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={value2Key as string}
            stroke={color2}
            strokeWidth={2}
            dot={singlePoint ? { r: 4, strokeWidth: 0, fill: color2 } : false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        )}
      </RLineChart>
    </ChartContainer>
  );
}
