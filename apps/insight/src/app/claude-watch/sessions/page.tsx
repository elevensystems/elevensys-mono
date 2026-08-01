'use client';

import { useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';

import {
  Column,
  DataTable,
} from '@/components/features/claude-watch/data-table';
import {
  COST,
  PALETTE,
  modelColor,
} from '@/components/features/claude-watch/lib/colors';
import {
  fc,
  fd,
  ft,
  rel,
  shortId,
} from '@/components/features/claude-watch/lib/format';
import { SectionHeader } from '@/components/features/claude-watch/section-header';
import {
  UsageError,
  UsageLoading,
} from '@/components/features/claude-watch/states';
import { UsageBadge } from '@/components/features/claude-watch/usage-badge';
import { useRangeParams, useSessions } from '@/hooks/use-claude-watch';
import type { SessionSummary } from '@/types/claude-watch';

export default function SessionsPage() {
  const { from, to } = useRangeParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const [developerId, setDeveloperId] = useState('');
  const [project, setProject] = useState('');
  const [applied, setApplied] = useState({ developerId: '', project: '' });

  const { sessions, loading, loadingMore, error, nextCursor, loadMore } =
    useSessions({
      from,
      to,
      developerId: applied.developerId || undefined,
      project: applied.project || undefined,
    });

  const columns: Column<SessionSummary>[] = [
    {
      label: 'Session',
      render: r => (
        <span className="font-mono" style={{ color: PALETTE.blue }}>
          {shortId(r.sessionId)}
        </span>
      ),
    },
    {
      label: 'Developer',
      render: r => <span className="font-mono">{r.developerId ?? '—'}</span>,
    },
    {
      label: 'Project / Branch',
      render: r => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs">{r.project ?? '—'}</span>
          <span className="text-muted-foreground font-mono text-[10.5px]">
            {r.branch ?? '—'}
          </span>
        </div>
      ),
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
      label: 'Sub',
      align: 'right',
      render: r => (
        <span className="font-mono" style={{ color: PALETTE.purple }}>
          {r.subagentTurns}
        </span>
      ),
    },
    {
      label: 'Prompts',
      align: 'right',
      render: r => <span className="font-mono">{r.prompts}</span>,
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
    {
      label: 'Tokens',
      align: 'right',
      render: r => (
        <span className="text-muted-foreground font-mono">{ft(r.tokens)}</span>
      ),
    },
    {
      label: 'Models',
      render: r => (
        <div className="flex gap-1.5">
          {r.modelsUsed.map(m => (
            <UsageBadge key={m} color={modelColor(m)} small mono>
              {m.replace('claude-', '')}
            </UsageBadge>
          ))}
        </div>
      ),
    },
    {
      label: 'Tools',
      align: 'center',
      render: r => (
        <span
          className="bg-muted border-border cursor-help rounded-full border px-2 py-px font-mono"
          title={r.toolsUsed.join(', ')}
        >
          {r.toolsUsed.length}
        </span>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader title="Sessions" />

      <form
        className="mb-4 flex flex-wrap gap-2.5"
        onSubmit={e => {
          e.preventDefault();
          setApplied({ developerId, project });
        }}
      >
        <Input
          value={developerId}
          onChange={e => setDeveloperId(e.target.value)}
          placeholder="Developer ID"
          className="w-44 font-mono"
        />
        <Input
          value={project}
          onChange={e => setProject(e.target.value)}
          placeholder="Project"
          className="w-44 font-mono"
        />
        <Button type="submit" variant="secondary">
          Apply filters
        </Button>
      </form>

      {loading ? (
        <UsageLoading />
      ) : error ? (
        <UsageError message={error} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={sessions}
            minWidth={1100}
            onRowClick={r =>
              router.push(
                `/claude-watch/sessions/${encodeURIComponent(r.sessionId)}${suffix}`
              )
            }
          />
          {nextCursor && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
