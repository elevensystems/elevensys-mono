'use client';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@workspace/ui/components/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';

export interface RankedBarDatum {
  /** Category label (e.g. an event name). */
  label: string;
  value: number;
}

interface RankedBarChartProps {
  /** Ranked data, highest first (rendered top to bottom in given order). */
  data: RankedBarDatum[];
  /** Bar fill color (any CSS color) — one hue: the bars encode magnitude, not identity. */
  color: string;
  /** Series label shown in the tooltip (e.g. "Events"). */
  valueLabel: string;
  /** Width reserved for category labels on the left. */
  labelWidth?: number;
  /** Chart height; defaults to a per-row height so bars stay thin. */
  height?: number;
  emptyMessage?: string;
}

/**
 * Generic horizontal ranked bar chart over the shared recharts primitives.
 * One measure across categories, so all bars share a single hue; values are
 * direct-labeled at the bar ends in text ink.
 */
export function RankedBarChart({
  data,
  color,
  valueLabel,
  labelWidth = 140,
  height,
  emptyMessage = 'No data in range',
}: RankedBarChartProps) {
  const resolvedHeight = height ?? Math.max(data.length * 32 + 16, 96);

  if (data.length === 0) {
    return (
      <div
        className="text-muted-foreground flex items-center justify-center text-sm"
        style={{ height: resolvedHeight }}
      >
        {emptyMessage}
      </div>
    );
  }

  const config: ChartConfig = { value: { label: valueLabel, color } };

  return (
    <ChartContainer
      config={config}
      className="aspect-auto"
      style={{ height: resolvedHeight }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 4, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={labelWidth}
          tick={{ fontSize: 10.5 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={18}>
          <LabelList
            dataKey="value"
            position="right"
            className="fill-muted-foreground"
            fontSize={10.5}
            formatter={(value: unknown) =>
              typeof value === 'number'
                ? value.toLocaleString()
                : String(value ?? '')
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
