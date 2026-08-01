'use client';

import { useParams, useSearchParams } from 'next/navigation';

import { Check } from 'lucide-react';

import {
  COST,
  PALETTE,
  evtColor,
  toolColor,
} from '@/components/features/claude-watch/lib/colors';
import {
  fc,
  fc6,
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
import {
  Chip,
  UsageBadge,
} from '@/components/features/claude-watch/usage-badge';
import { UsageCard } from '@/components/features/claude-watch/usage-card';
import { usagePath, useClaudeWatch } from '@/hooks/use-claude-watch';
import type { SessionDetail, UsageEvent } from '@/types/claude-watch';

type Payload = Record<string, unknown>;

const str = (p: Payload, key: string): string =>
  typeof p[key] === 'string' ? (p[key] as string) : '';
const numv = (p: Payload, key: string): number =>
  typeof p[key] === 'number' ? (p[key] as number) : 0;
const obj = (p: Payload, key: string): Payload =>
  p[key] && typeof p[key] === 'object' ? (p[key] as Payload) : {};

function EventDetail({ event }: { event: UsageEvent }) {
  const p = event.payload;
  switch (event.eventType) {
    case 'UserPromptSubmit':
      return (
        <span className="text-muted-foreground">
          “{str(p, 'promptPreview')}” ({numv(p, 'promptLength')} chars)
        </span>
      );
    case 'Stop':
    case 'SubagentStop': {
      const usage = obj(p, 'usage');
      return (
        <span className="text-muted-foreground font-mono text-[11.5px]">
          {str(p, 'model').replace('claude-', '')} · in{' '}
          {ft(numv(usage, 'inputTokens'))} / out{' '}
          {ft(numv(usage, 'outputTokens'))} / cache{' '}
          {ft(numv(usage, 'cacheReadTokens'))} ·{' '}
          <span style={{ color: COST }}>{fc6(numv(p, 'costUSD'))}</span>
        </span>
      );
    }
    case 'PostToolUse':
      return (
        <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-[11.5px]">
          <UsageBadge color={toolColor(str(p, 'tool'))} small mono>
            {str(p, 'tool')}
          </UsageBadge>
          <span className="text-foreground/80">{str(p, 'target')}</span>
          <span className="text-muted-foreground/60">·</span>
          {numv(p, 'durationMs')}ms
          <Check className="size-3" style={{ color: PALETTE.green }} />
        </span>
      );
    case 'PostToolUseFailure':
      return (
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[11.5px]"
          style={{ color: PALETTE.red }}
        >
          <UsageBadge color={PALETTE.red} small mono>
            {str(p, 'tool')}
          </UsageBadge>
          <span>{str(p, 'target')}</span>— {str(p, 'error')}
        </span>
      );
    case 'PermissionDenied':
      return (
        <span
          className="font-mono text-[11.5px]"
          style={{ color: PALETTE.orange }}
        >
          {str(p, 'tool')} → {str(p, 'target')} (denied)
        </span>
      );
    case 'PreCompact':
    case 'PostCompact':
      return (
        <span className="text-muted-foreground text-[11.5px]">
          {str(p, 'note')}
        </span>
      );
    case 'SessionStart':
      return (
        <span className="text-muted-foreground text-[11.5px]">
          trigger: {str(p, 'trigger')}
        </span>
      );
    case 'SessionEnd':
      return (
        <span className="text-muted-foreground text-[11.5px]">
          session closed
        </span>
      );
    default:
      return null;
  }
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const searchParams = useSearchParams();
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const { data, loading, error } = useClaudeWatch<SessionDetail>(
    usagePath(`sessions/${encodeURIComponent(id)}`)
  );

  if (loading) return <UsageLoading />;
  if (error) return <UsageError message={error} />;
  if (!data) return null;

  const sm = data.summary;
  const summaryChips: { label: string; value: string; color?: string }[] = sm
    ? [
        { label: 'Turns', value: `${sm.turns}` },
        {
          label: 'Subagent Turns',
          value: `${sm.subagentTurns}`,
          color: PALETTE.purple,
        },
        { label: 'Prompts', value: `${sm.prompts}`, color: PALETTE.blue },
        { label: 'Cost', value: fc(sm.costUSD), color: COST },
        { label: 'Tokens', value: ft(sm.tokens) },
      ]
    : [];

  return (
    <div>
      <SectionHeader
        title={shortId(id, 12)}
        backHref={`/claude-watch/sessions${suffix}`}
        backLabel="Sessions"
      />

      {sm && (
        <div className="text-muted-foreground mb-5 flex flex-wrap items-center gap-3 text-[12.5px]">
          <span className="text-foreground font-mono">{sm.developerId}</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="font-mono">{sm.project}</span>
          {sm.branch && <Chip>{sm.branch}</Chip>}
          <span className="text-muted-foreground/50">·</span>
          <span>Duration {fd(sm.durationMs)}</span>
          <span className="text-muted-foreground/50">·</span>
          <span title={sm.startedAt ?? ''}>{rel(sm.startedAt)}</span>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-5">
        {summaryChips.map(c => (
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

      <UsageCard title="Event Timeline">
        <div className="relative pl-6">
          <div className="bg-border absolute bottom-1.5 left-1.5 top-1.5 w-0.5" />
          {data.events.map(e => {
            const col = evtColor(e.eventType);
            return (
              <div
                key={e.eventId}
                className="relative flex items-start gap-3.5 py-2"
              >
                <span
                  className="ring-card absolute top-3 size-[11px] rounded-full ring-[3px]"
                  style={{ left: -22, background: col }}
                />
                <span className="text-muted-foreground w-24 flex-none pt-0.5 font-mono text-[11px]">
                  {new Date(e.timestamp).toISOString().slice(11, 23)}
                </span>
                <span className="flex-none">
                  <UsageBadge color={col} small>
                    {e.eventType}
                  </UsageBadge>
                </span>
                <span className="min-w-0 overflow-hidden pt-0.5 text-xs">
                  <EventDetail event={e} />
                </span>
              </div>
            );
          })}
        </div>
      </UsageCard>
    </div>
  );
}
