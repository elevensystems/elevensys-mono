'use client';

import {
  Column,
  DataTable,
} from '@/components/features/claude-watch/data-table';
import {
  PALETTE,
  successColor,
  toolColor,
} from '@/components/features/claude-watch/lib/colors';
import { sum } from '@/components/features/claude-watch/lib/format';
import { SectionHeader } from '@/components/features/claude-watch/section-header';
import {
  UsageError,
  UsageLoading,
} from '@/components/features/claude-watch/states';
import {
  TopUsers,
  UsageBadge,
} from '@/components/features/claude-watch/usage-badge';
import {
  usagePath,
  useClaudeWatch,
  useRangeParams,
} from '@/hooks/use-claude-watch';
import type { ToolRow, ToolsResponse } from '@/types/claude-watch';

export default function ToolsPage() {
  const { from, to } = useRangeParams();
  const { data, loading, error } = useClaudeWatch<ToolsResponse>(
    usagePath('tools', { from, to })
  );

  if (loading) return <UsageLoading />;
  if (error) return <UsageError message={error} />;
  if (!data) return null;

  const tools = data.tools;
  const maxCount = Math.max(1, ...tools.map(t => t.count));
  const totalCalls = sum(tools.map(t => t.count)) || 1;

  const columns: Column<ToolRow>[] = [
    {
      label: 'Tool',
      render: r => (
        <span className="flex items-center gap-2 font-mono font-medium">
          <span
            className="size-[7px] rounded-full"
            style={{ background: toolColor(r.tool) }}
          />
          {r.tool}
        </span>
      ),
    },
    {
      label: 'Call Count',
      render: r => (
        <div className="flex min-w-[190px] items-center gap-3">
          <span className="w-[54px] font-mono">{r.count.toLocaleString()}</span>
          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded">
            <div
              className="h-full rounded"
              style={{
                width: `${(r.count / maxCount) * 100}%`,
                background: toolColor(r.tool),
              }}
            />
          </div>
        </div>
      ),
    },
    {
      label: 'Failures',
      align: 'right',
      render: r => (
        <span
          className="font-mono"
          style={{ color: r.failures > 0 ? PALETTE.red : undefined }}
        >
          {r.failures}
        </span>
      ),
    },
    {
      label: 'Success Rate',
      align: 'center',
      render: r => (
        <UsageBadge color={successColor(r.successRate)} mono>
          {r.successRate}%
        </UsageBadge>
      ),
    },
    {
      label: '% of Calls',
      render: r => {
        const p = (r.count / totalCalls) * 100;
        return (
          <div className="flex min-w-[150px] items-center gap-2.5">
            <div className="bg-muted h-[5px] flex-1 overflow-hidden rounded">
              <div
                className="h-full rounded"
                style={{ width: `${p}%`, background: PALETTE.slate }}
              />
            </div>
            <span className="text-muted-foreground w-[44px] text-right font-mono">
              {p.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
    {
      label: 'Top Users',
      render: r => (
        <TopUsers
          users={r.byDeveloper.slice(0, 5).map(u => ({
            developerId: u.developerId,
            title: `${u.developerId}  ${u.count} calls`,
          }))}
        />
      ),
    },
  ];

  return (
    <div>
      <SectionHeader title="Tools" />
      <DataTable columns={columns} rows={tools} minWidth={900} />
    </div>
  );
}
