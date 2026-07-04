'use client';

import { VBars } from '@/components/features/claude-watch/charts/v-bars';
import {
  Column,
  DataTable,
} from '@/components/features/claude-watch/data-table';
import { catColor, COST } from '@/components/features/claude-watch/lib/colors';
import { fc } from '@/components/features/claude-watch/lib/format';
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
import type {
  PromptCategoriesResponse,
  PromptCategoryRow,
} from '@/types/claude-watch';

export default function PromptCategoriesPage() {
  const { from, to } = useRangeParams();
  const { data, loading, error } = useClaudeWatch<PromptCategoriesResponse>(
    usagePath('prompt-categories', { from, to })
  );

  if (loading) return <UsageLoading />;
  if (error) return <UsageError message={error} />;
  if (!data) return null;

  const cats = data.categories;

  const columns: Column<PromptCategoryRow>[] = [
    {
      label: 'Category',
      render: r => (
        <UsageBadge color={catColor(r.category)} dot>
          {r.category}
        </UsageBadge>
      ),
    },
    {
      label: 'Count',
      align: 'right',
      render: r => <span className="font-mono">{r.count.toLocaleString()}</span>,
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
      label: '% of Cost',
      render: r => (
        <div className="flex min-w-[170px] items-center gap-3">
          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded">
            <div
              className="h-full rounded"
              style={{ width: `${r.pctOfCost}%`, background: catColor(r.category) }}
            />
          </div>
          <span className="text-muted-foreground w-[50px] text-right font-mono">
            {r.pctOfCost}%
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
      <SectionHeader title="Prompt Categories" />
      <UsageCard title="Prompt Volume by Category" className="mb-4">
        <VBars
          items={cats}
          value={c => c.count}
          color={c => catColor(c.category)}
          topLabel={c => c.count}
          label={c => c.category}
          title={c => `${c.category}: ${c.count}`}
          height={200}
          gap={12}
        />
      </UsageCard>
      <DataTable columns={columns} rows={cats} minWidth={800} />
    </div>
  );
}
