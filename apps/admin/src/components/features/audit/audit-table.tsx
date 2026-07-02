'use client';

import { useCallback, useState } from 'react';

import { Search } from 'lucide-react';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';

import { useSystemLogs, type LogEntry } from '@/hooks/use-system-logs';

const today = () => new Date().toISOString().slice(0, 10);

const KNOWN_EVENTS = [
  'JIRA_PROXY',
  'JIRA_PROXY_ERROR',
];

function levelBadge(level: string) {
  if (level === 'ERROR') return <Badge variant="destructive">ERROR</Badge>;
  if (level === 'WARN') return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">WARN</Badge>;
  return <Badge variant="secondary">INFO</Badge>;
}

function statusBadge(status?: number) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const color =
    status < 300 ? 'text-green-600' :
    status < 500 ? 'text-yellow-600' :
                   'text-red-600';
  return <span className={`font-mono text-sm ${color}`}>{status}</span>;
}

function TruncatedUrl({ url }: { url?: string }) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  const short = url.length > 60 ? `${url.slice(0, 60)}…` : url;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default font-mono text-xs">{short}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm break-all font-mono text-xs">
          {url}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatTimestamp(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export function AuditTable() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [level, setLevel] = useState('all');
  const [event, setEvent] = useState('all');
  const [search, setSearch] = useState('');

  const { items, loading, error, fetchLogs } = useSystemLogs();

  const handleSearch = useCallback(() => {
    fetchLogs({ from, to, level: level === 'all' ? undefined : level, event: event === 'all' ? undefined : event, search: search || undefined });
  }, [from, to, level, event, search, fetchLogs]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        <DateRangePicker
          from={from}
          to={to}
          onRangeChange={(f, t) => { setFrom(f); setTo(t); }}
        />

        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="WARN">WARN</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
          </SelectContent>
        </Select>

        <Select value={event} onValueChange={setEvent}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {KNOWN_EVENTS.map(e => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="w-56"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <Button onClick={handleSearch} disabled={loading}>
          <Search className="mr-2 size-4" />
          Search
        </Button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Issue Key</TableHead>
              <TableHead>URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  {error ? 'Query failed.' : 'No audit logs found. Try adjusting the filters and clicking Search.'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((row, i) => (
                <TableRow key={row.reqId ?? i}>
                  <TableCell className="whitespace-nowrap text-xs">{formatTimestamp(row.timestamp)}</TableCell>
                  <TableCell>{levelBadge(row.level)}</TableCell>
                  <TableCell className="font-mono text-xs">{row.event ?? '—'}</TableCell>
                  <TableCell className="text-xs">{row.operation ?? '—'}</TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell className="text-xs">{row.duration != null ? `${row.duration}ms` : '—'}</TableCell>
                  <TableCell className="text-xs">{row.username ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{row.issueKey ?? '—'}</TableCell>
                  <TableCell><TruncatedUrl url={row.url} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && items.length > 0 && (
        <p className="text-right text-xs text-muted-foreground">{items.length} entries</p>
      )}
    </div>
  );
}
