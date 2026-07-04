'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  Column,
  DataTable,
} from '@/components/features/claude-watch/data-table';
import { COST } from '@/components/features/claude-watch/lib/colors';
import { fc } from '@/components/features/claude-watch/lib/format';
import { SectionHeader } from '@/components/features/claude-watch/section-header';
import {
  UsageError,
  UsageLoading,
} from '@/components/features/claude-watch/states';
import {
  useClaudeWatch,
  useRangeParams,
  usagePath,
} from '@/hooks/use-claude-watch';
import type { ProjectRow, ProjectsResponse } from '@/types/claude-watch';

export default function ProjectsPage() {
  const { from, to } = useRangeParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const { data, loading, error } = useClaudeWatch<ProjectsResponse>(
    usagePath('projects', { from, to })
  );

  const maxCost = Math.max(1, ...(data?.projects ?? []).map(p => p.costUSD));

  const columns: Column<ProjectRow>[] = [
    {
      label: 'Repo',
      render: r => <span className="font-mono font-medium">{r.repo}</span>,
    },
    {
      label: 'Cost',
      render: r => (
        <div className="flex min-w-[200px] items-center gap-3">
          <span className="w-[62px] font-mono font-medium" style={{ color: COST }}>
            {fc(r.costUSD)}
          </span>
          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded">
            <div
              className="h-full rounded"
              style={{ width: `${(r.costUSD / maxCost) * 100}%`, background: COST }}
            />
          </div>
        </div>
      ),
    },
    {
      label: 'Sessions',
      align: 'right',
      render: r => <span className="font-mono">{r.sessions}</span>,
    },
    {
      label: 'Total Turns',
      align: 'right',
      render: r => <span className="font-mono">{r.turns.toLocaleString()}</span>,
    },
    {
      label: 'Contributors',
      align: 'right',
      render: r => (
        <div className="flex items-center justify-end">
          <div className="flex">
            {r.contributors.slice(0, 4).map((c, i) => (
              <span
                key={c}
                title={c}
                className="bg-muted text-foreground/80 ring-card flex size-6 items-center justify-center rounded-full text-[10px] font-semibold ring-2"
                style={{ marginLeft: i ? -9 : 0 }}
              >
                {c.slice(0, 2)}
              </span>
            ))}
          </div>
          {r.contributors.length > 4 && (
            <span className="text-muted-foreground ml-1.5 font-mono text-[11.5px]">
              +{r.contributors.length - 4}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader title="Projects" />
      {loading ? (
        <UsageLoading />
      ) : error ? (
        <UsageError message={error} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.projects ?? []}
          onRowClick={r =>
            router.push(`/claude-watch/projects/${encodeURIComponent(r.repo)}${suffix}`)
          }
        />
      )}
    </div>
  );
}
