'use client';

import { LineChart } from '@/components/features/claude-watch/charts/line-chart';
import { COST, PALETTE } from '@/components/features/claude-watch/lib/colors';
import { fc, ft } from '@/components/features/claude-watch/lib/format';
import { SectionHeader } from '@/components/features/claude-watch/section-header';
import { StatTile } from '@/components/features/claude-watch/stat-tile';
import {
  UsageError,
  UsageLoading,
} from '@/components/features/claude-watch/states';
import { UsageCard } from '@/components/features/claude-watch/usage-card';
import {
  useClaudeWatch,
  useRangeParams,
  usagePath,
} from '@/hooks/use-claude-watch';
import type { OverviewResponse } from '@/types/claude-watch';

export default function OverviewPage() {
  const { from, to } = useRangeParams();
  const { data, loading, error } = useClaudeWatch<OverviewResponse>(
    usagePath('overview', { from, to })
  );

  if (loading) return <UsageLoading />;
  if (error) return <UsageError message={error} />;
  if (!data) return null;

  const { totals, change } = data;

  return (
    <div>
      <SectionHeader title="Overview" />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="Total Cost"
          value={fc(totals.costUSD)}
          pct={change.costUSDPct}
        />
        <StatTile
          label="Total Tokens"
          value={ft(totals.tokens)}
          pct={change.tokensPct}
        />
        <StatTile
          label="Sessions"
          value={totals.sessions.toLocaleString()}
          pct={change.sessionsPct}
        />
        <StatTile
          label="Turns"
          value={totals.turns.toLocaleString()}
          foot="across all sessions"
        />
        <StatTile
          label="Subagent Turns"
          value={totals.subagentTurns.toLocaleString()}
          foot="spawned via Task"
        />
        <StatTile
          label="Active Developers"
          value={`${totals.activeDevelopers}`}
          foot="active in range"
        />
      </div>

      <UsageCard
        title="Daily Cost + Tokens"
        right={
          <div className="flex gap-4 text-[11.5px]">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span
                className="h-[3px] w-[18px] rounded-sm"
                style={{ background: COST }}
              />
              costUSD
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span
                className="h-[3px] w-[18px] rounded-sm"
                style={{ background: PALETTE.blue }}
              />
              tokens
            </span>
          </div>
        }
      >
        <div className="px-2">
          <LineChart
            data={data.series}
            valueKey="costUSD"
            value2Key="tokens"
            height={300}
            fmtLeft={v => `$${v.toFixed(1)}`}
          />
        </div>
      </UsageCard>
    </div>
  );
}
