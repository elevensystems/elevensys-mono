'use client';

import { useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@workspace/ui/lib/utils';

import {
  Column,
  DataTable,
} from '@/components/features/claude-watch/data-table';
import {
  COST,
  modelColor,
  toolColor,
} from '@/components/features/claude-watch/lib/colors';
import { fc, fd, ft, rel } from '@/components/features/claude-watch/lib/format';
import { SectionHeader } from '@/components/features/claude-watch/section-header';
import {
  UsageError,
  UsageLoading,
} from '@/components/features/claude-watch/states';
import { UsageBadge } from '@/components/features/claude-watch/usage-badge';
import {
  usagePath,
  useClaudeWatch,
  useRangeParams,
} from '@/hooks/use-claude-watch';
import type {
  DeveloperRow,
  DeveloperSort,
  DevelopersResponse,
} from '@/types/claude-watch';

const SORTS: DeveloperSort[] = ['cost', 'tokens', 'sessions', 'turns'];

const totalTokens = (r: DeveloperRow) =>
  r.tokens.input + r.tokens.output + r.tokens.cacheRead + r.tokens.cacheWrite;

export default function DevelopersPage() {
  const { from, to } = useRangeParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const [sortBy, setSortBy] = useState<DeveloperSort>('cost');

  const { data, loading, error } = useClaudeWatch<DevelopersResponse>(
    usagePath('developers', { from, to, sortBy })
  );

  const columns: Column<DeveloperRow>[] = [
    {
      label: '#',
      render: (_r, i) => (
        <span className="text-muted-foreground font-mono">{i + 1}</span>
      ),
    },
    {
      label: 'Developer',
      render: r => (
        <span className="font-mono font-medium">{r.developerId}</span>
      ),
    },
    {
      label: 'Cost',
      align: 'right',
      render: r => (
        <span className="font-mono font-medium" style={{ color: COST }}>
          {fc(r.costUSD)}
        </span>
      ),
    },
    {
      label: 'Tokens',
      align: 'right',
      render: r => (
        <span
          className="decoration-muted-foreground cursor-help font-mono underline decoration-dotted"
          title={`Input ${ft(r.tokens.input)} · Output ${ft(r.tokens.output)} · Cache R ${ft(
            r.tokens.cacheRead
          )} · Cache W ${ft(r.tokens.cacheWrite)}`}
        >
          {ft(totalTokens(r))}
        </span>
      ),
    },
    {
      label: 'Sessions',
      align: 'right',
      render: r => <span className="font-mono">{r.sessions}</span>,
    },
    {
      label: 'Turns',
      align: 'right',
      render: r => <span className="font-mono">{r.turns}</span>,
    },
    {
      label: 'Avg Dur',
      align: 'right',
      render: r => (
        <span className="text-muted-foreground font-mono">
          {fd(r.avgSessionDurationMs)}
        </span>
      ),
    },
    {
      label: 'Turns/Sess',
      align: 'right',
      render: r => (
        <span className="text-muted-foreground font-mono">
          {r.avgTurnsPerSession.toFixed(1)}
        </span>
      ),
    },
    {
      label: 'Top Model',
      render: r =>
        r.mostUsedModel ? (
          <UsageBadge color={modelColor(r.mostUsedModel)} small mono>
            {r.mostUsedModel.replace('claude-', '')}
          </UsageBadge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      label: 'Top Tool',
      render: r =>
        r.mostUsedTool ? (
          <UsageBadge color={toolColor(r.mostUsedTool)} small mono>
            {r.mostUsedTool}
          </UsageBadge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      label: 'Projects',
      align: 'center',
      render: r => (
        <span
          className="bg-muted border-border cursor-help rounded-full border px-2 py-px font-mono"
          title={r.projectsTouched.join(', ')}
        >
          {r.projectsTouched.length}
        </span>
      ),
    },
    {
      label: 'Last Active',
      align: 'right',
      render: r => (
        <span className="text-muted-foreground" title={r.lastActive ?? ''}>
          {rel(r.lastActive)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader title="Developers" />

      <div className="mb-4 flex gap-1.5">
        {SORTS.map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={cn(
              'rounded-lg border px-3.5 py-1.5 text-[12.5px] font-medium capitalize transition-colors',
              sortBy === s
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 border-transparent'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <UsageLoading />
      ) : error ? (
        <UsageError message={error} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.developers ?? []}
          minWidth={1000}
          onRowClick={r =>
            router.push(
              `/claude-watch/developers/${encodeURIComponent(r.developerId)}${suffix}`
            )
          }
        />
      )}
    </div>
  );
}
