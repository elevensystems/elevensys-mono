'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

import { PALETTE } from '@/components/features/claude-watch/lib/colors';

export interface StatTileProps {
  label: string;
  value: string;
  /** Period-over-period percentage change (nullable). */
  pct?: number | null;
  /** Footnote shown when there is no `pct`. */
  foot?: string;
  mono?: boolean;
}

export function StatTile({ label, value, pct, foot, mono }: StatTileProps) {
  const hasPct = pct !== undefined && pct !== null;
  const pos = hasPct && pct! > 0;
  const neg = hasPct && pct! < 0;
  const trendColor = pos ? PALETTE.green : neg ? PALETTE.red : undefined;
  const TrendIcon = pos ? ArrowUp : neg ? ArrowDown : Minus;

  return (
    <div className="bg-card flex flex-col gap-2 rounded-xl border px-[17px] py-[15px]">
      <div className="text-muted-foreground text-[11.5px] font-medium uppercase tracking-wide">
        {label}
      </div>
      <div className="flex flex-wrap items-baseline gap-2.5">
        <div
          className={`text-2xl font-bold tracking-tight ${mono ? 'font-mono' : ''}`}
        >
          {value}
        </div>
        {hasPct ? (
          <div
            className="inline-flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: trendColor ?? 'var(--muted-foreground)' }}
          >
            <TrendIcon className="size-3" />
            {Math.abs(pct!).toFixed(1)}%
          </div>
        ) : (
          <div className="text-muted-foreground text-[11.5px]">
            {foot ?? ''}
          </div>
        )}
      </div>
    </div>
  );
}
