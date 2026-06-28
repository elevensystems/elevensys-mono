'use client';

import { Donut } from '@/components/features/claude-watch/charts/donut';
import {
  Column,
  DataTable,
} from '@/components/features/claude-watch/data-table';
import { COST, modelColor } from '@/components/features/claude-watch/lib/colors';
import { fc, ft, sum } from '@/components/features/claude-watch/lib/format';
import { SectionHeader } from '@/components/features/claude-watch/section-header';
import {
  UsageError,
  UsageLoading,
} from '@/components/features/claude-watch/states';
import { UsageBadge, TopUsers } from '@/components/features/claude-watch/usage-badge';
import { UsageCard } from '@/components/features/claude-watch/usage-card';
import {
  useClaudeWatch,
  useRangeParams,
  usagePath,
} from '@/hooks/use-claude-watch';
import type { ModelRow, ModelsResponse } from '@/types/claude-watch';

export default function ModelsPage() {
  const { from, to } = useRangeParams();
  const { data, loading, error } = useClaudeWatch<ModelsResponse>(
    usagePath('models', { from, to })
  );

  if (loading) return <UsageLoading />;
  if (error) return <UsageError message={error} />;
  if (!data) return null;

  const models = data.models;
  const total = sum(models.map(m => m.costUSD));

  const columns: Column<ModelRow>[] = [
    {
      label: 'Model',
      render: r => (
        <UsageBadge color={modelColor(r.model)} mono>
          {r.model}
        </UsageBadge>
      ),
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
      render: r => <span className="font-mono">{ft(r.tokens)}</span>,
    },
    {
      label: '% of Total',
      render: r => (
        <div className="flex min-w-[180px] items-center gap-3">
          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded">
            <div
              className="h-full rounded"
              style={{ width: `${r.pctOfTotal}%`, background: modelColor(r.model) }}
            />
          </div>
          <span className="text-muted-foreground w-[50px] text-right font-mono">
            {r.pctOfTotal}%
          </span>
        </div>
      ),
    },
    {
      label: 'Top Users',
      render: r => (
        <TopUsers
          users={r.topUsers.map(u => ({
            developerId: u.developerId,
            title: `${u.developerId}  ${fc(u.costUSD)}`,
          }))}
        />
      ),
    },
  ];

  return (
    <div>
      <SectionHeader title="Models" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <UsageCard title="Cost by Model">
          <div className="flex flex-col items-center gap-4">
            <Donut
              items={models}
              value={m => m.costUSD}
              color={m => modelColor(m.model)}
              center={fc(total)}
              centerLabel="Total"
              size={200}
              strokeWidth={24}
            />
            <div className="flex w-full flex-col gap-2">
              {models.map(m => (
                <div
                  key={m.model}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-2 font-mono text-[11.5px]">
                    <span
                      className="size-[9px] rounded-sm"
                      style={{ background: modelColor(m.model) }}
                    />
                    {m.model.replace('claude-', '')}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {m.pctOfTotal}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </UsageCard>
        <UsageCard title="Breakdown" bodyClassName="-mx-1">
          <DataTable columns={columns} rows={models} />
        </UsageCard>
      </div>
    </div>
  );
}
