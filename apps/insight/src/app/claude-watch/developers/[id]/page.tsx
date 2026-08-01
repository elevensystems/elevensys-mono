'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { Donut } from '@/components/features/claude-watch/charts/donut';
import { HBars } from '@/components/features/claude-watch/charts/h-bars';
import { LineChart } from '@/components/features/claude-watch/charts/line-chart';
import {
  Column,
  DataTable,
} from '@/components/features/claude-watch/data-table';
import {
  COST,
  PALETTE,
  SERIES_COLORS,
  catColor,
  modelColor,
  successColor,
  toolColor,
} from '@/components/features/claude-watch/lib/colors';
import {
  fc,
  fd,
  ft,
  rel,
  shortId,
  sum,
} from '@/components/features/claude-watch/lib/format';
import { SectionHeader } from '@/components/features/claude-watch/section-header';
import {
  UsageError,
  UsageLoading,
} from '@/components/features/claude-watch/states';
import {
  Chip,
  UsageBadge,
} from '@/components/features/claude-watch/usage-badge';
import { UsageCard } from '@/components/features/claude-watch/usage-card';
import {
  usagePath,
  useClaudeWatch,
  useRangeParams,
} from '@/hooks/use-claude-watch';
import type {
  DeveloperDetail,
  DevelopersResponse,
  SessionSummary,
} from '@/types/claude-watch';

export default function DeveloperDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const { from, to } = useRangeParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const detail = useClaudeWatch<DeveloperDetail>(
    usagePath(`developers/${encodeURIComponent(id)}`, { from, to })
  );
  const leaderboard = useClaudeWatch<DevelopersResponse>(
    usagePath('developers', { from, to })
  );

  if (detail.loading) return <UsageLoading />;
  if (detail.error) return <UsageError message={detail.error} />;
  if (!detail.data) return null;

  const D = detail.data;
  const row = leaderboard.data?.developers.find(d => d.developerId === id);
  const totalCost = row?.costUSD ?? sum(D.series.map(s => s.costUSD));
  const tokens = row
    ? row.tokens.input +
      row.tokens.output +
      row.tokens.cacheRead +
      row.tokens.cacheWrite
    : sum(D.series.map(s => s.tokens));

  const chips: { label: string; value: string; color?: string }[] = [
    { label: 'Total Cost', value: fc(totalCost), color: COST },
    { label: 'Tokens', value: ft(tokens) },
    { label: 'Sessions', value: row ? `${row.sessions}` : '—' },
    { label: 'Turns', value: row ? `${row.turns}` : '—' },
    {
      label: 'Compactions',
      value: `${D.compactionCount}`,
      color: PALETTE.yellow,
    },
    { label: 'Errors', value: `${D.errorCount}`, color: PALETTE.red },
    {
      label: 'Denied Tools',
      value: `${D.deniedToolCount}`,
      color: PALETTE.orange,
    },
  ];

  const sessionColumns: Column<SessionSummary>[] = [
    {
      label: 'Session',
      render: r => (
        <span className="font-mono" style={{ color: PALETTE.blue }}>
          {shortId(r.sessionId)}
        </span>
      ),
    },
    {
      label: 'Project',
      render: r => <span className="font-mono">{r.project ?? '—'}</span>,
    },
    {
      label: 'Branch',
      render: r => (r.branch ? <Chip>{r.branch}</Chip> : '—'),
    },
    {
      label: 'Started',
      align: 'right',
      render: r => (
        <span className="text-muted-foreground" title={r.startedAt ?? ''}>
          {rel(r.startedAt)}
        </span>
      ),
    },
    {
      label: 'Dur',
      align: 'right',
      render: r => (
        <span className="text-muted-foreground font-mono">
          {fd(r.durationMs)}
        </span>
      ),
    },
    {
      label: 'Turns',
      align: 'right',
      render: r => <span className="font-mono">{r.turns}</span>,
    },
    {
      label: 'Cost',
      align: 'right',
      render: r => (
        <span className="font-mono" style={{ color: COST }}>
          {fc(r.costUSD)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader
        title={id}
        backHref={`/claude-watch/developers${suffix}`}
        backLabel="Developers"
        right={
          <>
            <div
              className="font-mono text-2xl font-bold"
              style={{ color: COST }}
            >
              {fc(totalCost)}
            </div>
            <div className="text-muted-foreground text-xs">
              {from} → {to}
            </div>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-7">
        {chips.map(c => (
          <div key={c.label} className="bg-card rounded-xl border px-3.5 py-3">
            <div className="text-muted-foreground mb-1.5 text-[10.5px] uppercase tracking-wide">
              {c.label}
            </div>
            <div
              className="font-mono text-lg font-bold"
              style={{ color: c.color }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <UsageCard title="Daily Cost" className="mb-4">
        <div className="px-2">
          <LineChart
            data={D.series}
            valueKey="costUSD"
            height={200}
            fmtLeft={v => `$${v.toFixed(1)}`}
          />
        </div>
      </UsageCard>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UsageCard title="Model Breakdown">
          <div className="flex items-center gap-5">
            <Donut
              items={D.modelBreakdown}
              value={m => m.costUSD}
              color={m => modelColor(m.key)}
              center={fc(totalCost)}
              centerLabel="Cost"
              size={170}
            />
            <div className="min-w-0 flex-1">
              <HBars
                items={D.modelBreakdown}
                value={m => m.costUSD}
                label={m => m.key.replace('claude-', '')}
                monoLabel
                color={m => modelColor(m.key)}
                fmt={m => `${fc(m.costUSD)}  ·  ${m.pct}%`}
              />
            </div>
          </div>
        </UsageCard>

        <UsageCard title="Tool Usage">
          <div className="flex flex-col gap-3.5">
            {D.toolBreakdown.map(t => (
              <div key={t.tool} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="flex items-center gap-2 font-mono">
                    <span
                      className="h-[7px] w-[7px] rounded-full"
                      style={{ background: toolColor(t.tool) }}
                    />
                    {t.tool}
                  </span>
                  <span className="flex items-center gap-2.5">
                    <span className="text-muted-foreground font-mono text-[11.5px]">
                      {t.count} calls
                    </span>
                    <UsageBadge color={successColor(t.successRate)} small mono>
                      {t.successRate}%
                    </UsageBadge>
                  </span>
                </div>
                <div className="bg-muted h-[7px] overflow-hidden rounded">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${t.pct}%`,
                      background: toolColor(t.tool),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </UsageCard>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UsageCard title="Top Projects by Cost">
          <HBars
            items={D.topProjects}
            value={p => p.costUSD}
            label={p => p.project}
            monoLabel
            color={() => COST}
            fmt={p => fc(p.costUSD)}
          />
        </UsageCard>
        <UsageCard title="Bash Command Categories">
          <HBars
            items={D.topBashCategories}
            value={c => c.count}
            label={c => c.category}
            color={(_c, i) => SERIES_COLORS[i % SERIES_COLORS.length]}
            fmt={c => `${c.count} cmds`}
          />
        </UsageCard>
      </div>

      <UsageCard title="Prompt Intent Categories" className="mb-4">
        <HBars
          items={D.promptCategories}
          value={c => c.count}
          label={c => c.category}
          color={c => catColor(c.category)}
          fmt={c => `${c.count}  ·  ${fc(c.costUSD)}`}
        />
      </UsageCard>

      <UsageCard title="Recent Sessions" bodyClassName="-mx-1">
        <DataTable
          columns={sessionColumns}
          rows={D.recentSessions}
          onRowClick={r =>
            router.push(
              `/claude-watch/sessions/${encodeURIComponent(r.sessionId)}${suffix}`
            )
          }
        />
      </UsageCard>
    </div>
  );
}
