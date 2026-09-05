import {
  Panel,
  PanelActions,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from '@workspace/ui/components/panel';

import { type ConfigAuditEntry, HISTORY_LIMIT } from '@/types/config-audit';

interface ChangeLogProps {
  entries: ConfigAuditEntry[];
  /**
   * Display names for `entry.target`, for a feature that has more than one
   * slice. Omit it for a feature that does not — the target column is then
   * dropped rather than left blank.
   */
  targetLabels?: Record<string, string>;
}

const formatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatTimestamp(at: string): string {
  const date = new Date(at);
  return Number.isNaN(date.getTime()) ? at : formatter.format(date);
}

/** Recent edits to one config feature, newest first. */
export function ChangeLog({ entries, targetLabels }: ChangeLogProps) {
  return (
    <Panel dense={false}>
      <PanelHeader>
        <PanelTitle>Recent changes</PanelTitle>
        <PanelActions>
          <span className="text-muted-foreground text-[13px]">
            Last {HISTORY_LIMIT} edits, newest first
          </span>
        </PanelActions>
      </PanelHeader>

      <PanelBody>
        {entries.length === 0 ? (
          <p className="text-muted-foreground px-4 py-5 text-sm">
            No changes recorded yet.
          </p>
        ) : (
          <ul className="divide-y">
            {entries.map(entry => (
              <li
                key={`${entry.at}-${entry.target ?? ''}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
              >
                <span className="text-muted-foreground w-22 shrink-0 text-xs">
                  {entry.action === 'clear' ? 'Cleared' : 'Saved'}
                </span>
                <span className="min-w-0 flex-1 truncate">{entry.summary}</span>
                {targetLabels && (
                  <span className="text-muted-foreground w-24 text-[13px]">
                    {entry.target
                      ? (targetLabels[entry.target] ?? entry.target)
                      : '—'}
                  </span>
                )}
                <span className="text-muted-foreground w-20 truncate text-[13px]">
                  {entry.by}
                </span>
                <time
                  dateTime={entry.at}
                  className="text-muted-foreground shrink-0 text-xs tabular-nums"
                >
                  {formatTimestamp(entry.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}
