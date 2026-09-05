import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';

import { type ConfigAuditEntry, HISTORY_LIMIT } from '@/types/config-audit';

interface ChangeLogProps {
  entries: ConfigAuditEntry[];
  /**
   * Display names for `entry.target`, for a feature that has more than one
   * slice. Omit it for a feature that does not.
   */
  targetLabels?: Record<string, string>;
}

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatTimestamp(at: string): string {
  const date = new Date(at);
  return Number.isNaN(date.getTime()) ? at : formatter.format(date);
}

/** Recent edits to one config feature, newest first. */
export function ChangeLog({ entries, targetLabels }: ChangeLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent changes</CardTitle>
        <CardDescription>
          The last {HISTORY_LIMIT} edits, newest first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No changes recorded yet.
          </p>
        ) : (
          <ul className="divide-y">
            {entries.map(entry => (
              <li
                key={`${entry.at}-${entry.target ?? ''}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {entry.summary}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {entry.action === 'clear' ? 'Cleared' : 'Saved'}
                    {entry.target
                      ? ` for ${targetLabels?.[entry.target] ?? entry.target}`
                      : ''}{' '}
                    by {entry.by}
                  </p>
                </div>
                <time
                  dateTime={entry.at}
                  className="text-muted-foreground shrink-0 text-xs"
                >
                  {formatTimestamp(entry.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
