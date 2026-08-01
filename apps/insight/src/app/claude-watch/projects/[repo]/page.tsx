'use client';

import { useParams, useSearchParams } from 'next/navigation';

import { GitBranch } from 'lucide-react';

import { HBars } from '@/components/features/claude-watch/charts/h-bars';
import { LineChart } from '@/components/features/claude-watch/charts/line-chart';
import {
  Column,
  DataTable,
} from '@/components/features/claude-watch/data-table';
import { COST, PALETTE } from '@/components/features/claude-watch/lib/colors';
import { fc, sum } from '@/components/features/claude-watch/lib/format';
import { SectionHeader } from '@/components/features/claude-watch/section-header';
import {
  UsageError,
  UsageLoading,
} from '@/components/features/claude-watch/states';
import { UsageCard } from '@/components/features/claude-watch/usage-card';
import {
  usagePath,
  useClaudeWatch,
  useRangeParams,
} from '@/hooks/use-claude-watch';
import type { ProjectDetail } from '@/types/claude-watch';

type Contributor = ProjectDetail['contributors'][number];

export default function ProjectDetailPage() {
  const params = useParams<{ repo: string }>();
  const repo = decodeURIComponent(params.repo);
  const { from, to } = useRangeParams();
  const searchParams = useSearchParams();
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const { data, loading, error } = useClaudeWatch<ProjectDetail>(
    usagePath(`projects/${encodeURIComponent(repo)}`, { from, to })
  );

  if (loading) return <UsageLoading />;
  if (error) return <UsageError message={error} />;
  if (!data) return null;

  const D = data;
  const totalCost = sum(D.contributors.map(c => c.costUSD));

  const contributorColumns: Column<Contributor>[] = [
    {
      label: 'Developer',
      render: r => <span className="font-mono">{r.developerId}</span>,
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
      label: 'Share',
      render: r => (
        <div className="flex min-w-[160px] items-center gap-3">
          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded">
            <div
              className="h-full rounded"
              style={{ width: `${r.sharePct}%`, background: PALETTE.blue }}
            />
          </div>
          <span className="text-muted-foreground w-[46px] text-right font-mono">
            {r.sharePct}%
          </span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader
        title={repo}
        backHref={`/claude-watch/projects${suffix}`}
        backLabel="Projects"
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

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <UsageCard title="Contributors" bodyClassName="-mx-1">
          <DataTable columns={contributorColumns} rows={D.contributors} />
        </UsageCard>
        <UsageCard title="Active Branches">
          <div className="flex flex-wrap gap-2.5">
            {D.branches.length === 0 ? (
              <span className="text-muted-foreground text-sm">No branches</span>
            ) : (
              D.branches.map(b => (
                <span
                  key={b}
                  className="bg-muted border-border inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs"
                >
                  <GitBranch
                    className="size-3"
                    style={{ color: PALETTE.teal }}
                  />
                  {b}
                </span>
              ))
            )}
          </div>
        </UsageCard>
      </div>

      <UsageCard title="Files Most Edited">
        <HBars
          items={D.filesMostEdited}
          value={f => f.edits}
          label={f => f.file}
          monoLabel
          color={() => PALETTE.purple}
          fmt={f => `${f.edits} edits`}
          gap={11}
        />
      </UsageCard>
    </div>
  );
}
