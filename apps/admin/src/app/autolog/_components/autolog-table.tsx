'use client';

import { useMemo, useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Panel,
  PanelActions,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from '@workspace/ui/components/panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Spinner } from '@workspace/ui/components/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { cn } from '@workspace/ui/lib/utils';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDown,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layouts/page-header';
import type { AutologConfig } from '@/types/autolog';
import {
  RUN_STATUS_CONFIG,
  STATUS_LABELS,
  STATUS_VARIANTS,
  formatScheduleShort,
  totalHours,
} from '@/types/autolog';

import { AutologDeleteDialog } from './autolog-delete-dialog';
import { AutologDetailSheet } from './autolog-detail-sheet';

type StatusFilter = 'all' | AutologConfig['status'];
type SortKey = 'username' | 'projectName' | 'status' | 'lastRunAt';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZES = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

const formatDate = (iso?: string) => {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return null;
  return new Date(at).toLocaleString();
};

/** Sort value for a column, normalised so a single string compare is stable. */
const sortValue = (config: AutologConfig, key: SortKey): string => {
  if (key === 'lastRunAt') {
    // Never-run configs sort last ascending, which reads as "nothing here yet".
    const at = Date.parse(config.lastRunAt ?? '');
    return Number.isFinite(at) ? String(at).padStart(16, '0') : 'z';
  }
  return (config[key] ?? '').toLowerCase();
};

/**
 * Page numbers to show: always the first, last and the current page's
 * neighbours, with `null` marking each collapsed run in between.
 */
const pageWindow = (page: number, pageCount: number): (number | null)[] => {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const shown = [1, page - 1, page, page + 1, pageCount]
    .filter((n, i, all) => n >= 1 && n <= pageCount && all.indexOf(n) === i)
    .sort((a, b) => a - b);
  return shown.flatMap((n, i) =>
    i > 0 && n - shown[i - 1] > 1 ? [null, n] : [n]
  );
};

interface AutologTableProps {
  configs: AutologConfig[];
  loadError: string | null;
}

export function AutologTable({ configs, loadError }: AutologTableProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('username');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const [selected, setSelected] = useState<AutologConfig | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AutologConfig | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = configs.filter(config => {
      if (statusFilter !== 'all' && config.status !== statusFilter)
        return false;
      if (!needle) return true;
      return [
        config.username,
        config.email,
        config.projectName,
        config.projectKey,
        ...(config.tickets?.map(t => t.issueKey) ?? []),
      ].some(field => field?.toLowerCase().includes(needle));
    });

    const factor = sortDirection === 'asc' ? 1 : -1;
    return filtered.sort(
      (a, b) =>
        sortValue(a, sortKey).localeCompare(sortValue(b, sortKey)) * factor
    );
  }, [configs, query, statusFilter, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  // Clamped at render rather than in an effect, so a delete or refresh that
  // shrinks the list past the last page lands on the new last page.
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = visible.slice(pageStart, pageStart + pageSize);

  const pausedCount = configs.filter(c => c.status === 'paused_auth').length;

  const toggleSort = (key: SortKey) => {
    setPage(1);
    if (key === sortKey) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const openDetail = (config: AutologConfig) => {
    setSelected(config);
    setSheetOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { configId, username, projectName } = pendingDelete;
    setDeletingId(configId);
    try {
      const res = await fetch(
        `/api/autolog/${encodeURIComponent(configId)}?username=${encodeURIComponent(username)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      toast.success(`Deleted the ${projectName} config for ${username}`);
      setPendingDelete(null);
      setSheetOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete configuration'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        className="mb-2"
        title="Autolog"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Spinner /> : <RefreshCw className="size-4" />}
            Refresh
          </Button>
        }
      />

      {loadError && (
        <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <Panel>
        <PanelHeader>
          <PanelTitle>Configurations</PanelTitle>
          <PanelActions>
            {pausedCount > 0 && (
              <span className="text-destructive text-[13px]">
                {pausedCount} need re-auth
              </span>
            )}
            <span className="text-muted-foreground text-[13px]">
              {visible.length} of {configs.length}
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search user, project, ticket"
                aria-label="Search configurations"
                className="bg-background h-8 w-56 pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={v => {
                setStatusFilter(v as StatusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-background h-8 w-[150px]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused_auth">Re-auth required</SelectItem>
              </SelectContent>
            </Select>
          </PanelActions>
        </PanelHeader>

        <PanelBody>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead
                  label="Owner"
                  sortKey="username"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <SortableHead
                  label="Project"
                  sortKey="projectName"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <TableHead>Schedule</TableHead>
                <TableHead>Tickets</TableHead>
                <SortableHead
                  label="Status"
                  sortKey="status"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <SortableHead
                  label="Last run"
                  sortKey="lastRunAt"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={toggleSort}
                />
                <TableHead>Last result</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    {configs.length === 0
                      ? 'No autolog configurations found.'
                      : 'No configurations match this search.'}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map(config => {
                  const lastRun = formatDate(config.lastRunAt);
                  const runStatus = config.lastRunStatus
                    ? RUN_STATUS_CONFIG[config.lastRunStatus]
                    : null;
                  return (
                    <TableRow
                      key={config.configId}
                      onClick={() => openDetail(config)}
                      className={cn(
                        'cursor-pointer',
                        config.status === 'paused_auth' && 'bg-destructive/5'
                      )}
                    >
                      <TableCell>
                        <div className="font-medium">{config.username}</div>
                        <div className="text-muted-foreground text-xs">
                          {config.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{config.projectName}</div>
                        <div className="text-muted-foreground font-mono text-xs">
                          {config.projectKey}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatScheduleShort(config)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {config.tickets?.length ?? 0} · {totalHours(config)}h
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[config.status]}>
                          {STATUS_LABELS[config.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {lastRun ?? 'Never run'}
                      </TableCell>
                      <TableCell>
                        {runStatus ? (
                          <Badge variant={runStatus.variant}>
                            {runStatus.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {/* Per-row destructive action stays with its row. */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          disabled={deletingId === config.configId}
                          onClick={e => {
                            e.stopPropagation();
                            setPendingDelete(config);
                          }}
                          aria-label={`Delete the ${config.projectName} configuration for ${config.username}`}
                        >
                          {deletingId === config.configId ? (
                            <Spinner />
                          ) : (
                            <Trash2 />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </PanelBody>
      </Panel>

      {/* Hidden while everything fits on the smallest page size; once shown it
          stays, so a larger page size can always be switched back down. */}
      {visible.length > PAGE_SIZES[0] && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={v => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-8 w-[70px]"
                size="sm"
                aria-label="Rows per page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {PAGE_SIZES.map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">
              {pageStart + 1}–{pageStart + pageRows.length} of {visible.length}
            </span>
          </div>

          <AutologPagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      )}

      <AutologDetailSheet
        config={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onRequestDelete={setPendingDelete}
      />

      <AutologDeleteDialog
        config={pendingDelete}
        isDeleting={deletingId !== null}
        onOpenChange={open => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

interface SortableHeadProps {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: SortableHeadProps) {
  const active = activeKey === sortKey;
  const Icon = !active
    ? ChevronsUpDown
    : direction === 'asc'
      ? ArrowUp
      : ArrowDown;

  return (
    <TableHead
      aria-sort={
        active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="text-foreground focus-visible:ring-ring -ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 focus-visible:ring-2 focus-visible:outline-none"
        aria-label={`Sort by ${label}`}
      >
        {label}
        <Icon
          className={cn(
            'size-3.5',
            active ? 'text-foreground' : 'text-muted-foreground'
          )}
        />
      </button>
    </TableHead>
  );
}

interface AutologPaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

function AutologPagination({
  page,
  pageCount,
  onPageChange,
}: AutologPaginationProps) {
  return (
    <nav
      aria-label="pagination"
      className="flex items-center justify-end gap-1"
    >
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="size-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>
      {pageWindow(page, pageCount).map((n, i) =>
        n === null ? (
          <span
            key={`gap-${i}`}
            className="text-muted-foreground px-2 text-sm"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Button
            key={n}
            variant={n === page ? 'outline' : 'ghost'}
            size="sm"
            className="min-w-9"
            onClick={() => onPageChange(n)}
            aria-label={`Page ${n}`}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </Button>
        )
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRightIcon className="size-4" />
      </Button>
    </nav>
  );
}
