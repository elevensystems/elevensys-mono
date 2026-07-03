'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLink,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';

import { ActionButton } from '@workspace/ui/components/action-button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';

import { getUrlStatus, type ShortenedUrl } from '@/types/urlify';

const PAGE_SIZES = [5, 10, 20, 50] as const;

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

type UrlifyTableProps = {
  initialUrls: ShortenedUrl[];
  initialLimit: number;
  nextCursor: string | null;
};

export function UrlifyTable({
  initialUrls,
  initialLimit,
  nextCursor,
}: UrlifyTableProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const urls = initialUrls;
  const limit = initialLimit;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [viewedPage, setViewedPage] = useState(1);
  const [hasMoreBeyondKnown, setHasMoreBeyondKnown] = useState(false);

  // Reset selection + sync frontier flag when server data changes.
  // Render-time state sync is the React 19 pattern for "reset state when a prop changes".
  const [lastUrls, setLastUrls] = useState(urls);
  if (urls !== lastUrls) {
    setLastUrls(urls);
    setSelected(new Set());
    if (viewedPage === cursorStack.length + 1) {
      setHasMoreBeyondKnown(!!nextCursor);
    }
  }

  const knownPages = cursorStack.length + 1;
  const allSelected = urls.length > 0 && selected.size === urls.length;
  const someSelected = selected.size > 0 && selected.size < urls.length;
  const checkedValue: boolean | 'indeterminate' = allSelected
    ? true
    : someSelected
      ? 'indeterminate'
      : false;

  const navigate = useCallback(
    (lastKey: string | null, nextLimit = limit) => {
      const params = new URLSearchParams();
      params.set('limit', String(nextLimit));
      if (lastKey) params.set('lastKey', lastKey);
      const qs = params.toString();
      router.push(qs ? `/urlify?${qs}` : '/urlify', { scroll: false });
    },
    [router, limit]
  );

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(urls.map(u => u.shortCode)));
    }
  };

  const toggleOne = (shortCode: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(shortCode)) next.delete(shortCode);
      else next.add(shortCode);
      return next;
    });
  };

  const onPageChange = (n: number) => {
    if (n === viewedPage || n < 1) return;

    if (n > knownPages) {
      if (!hasMoreBeyondKnown || !nextCursor) return;
      setCursorStack(prev => [...prev, nextCursor]);
      setViewedPage(n);
      navigate(nextCursor);
      return;
    }

    setViewedPage(n);
    const cursor = n === 1 ? null : cursorStack[n - 2];
    navigate(cursor ?? null);
  };

  const changePageSize = (size: number) => {
    setCursorStack([]);
    setViewedPage(1);
    setHasMoreBeyondKnown(false);
    navigate(null, size);
  };

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const deleteOne = async (shortCode: string) => {
    setDeletingId(shortCode);
    try {
      const res = await fetch(
        `/api/urlify/url/${encodeURIComponent(shortCode)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('URL deleted');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete URL');
    } finally {
      setDeletingId(null);
    }
  };

  const confirmBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleteOpen(false);
    setIsBulkDeleting(true);
    setBulkDeleteProgress(0);
    const codes = Array.from(selected);
    const total = codes.length;
    let success = 0;
    let fail = 0;
    for (let i = 0; i < codes.length; i++) {
      try {
        const res = await fetch(
          `/api/urlify/url/${encodeURIComponent(codes[i])}`,
          { method: 'DELETE' }
        );
        if (!res.ok) throw new Error('failed');
        success++;
      } catch {
        fail++;
      }
      setBulkDeleteProgress(Math.round(((i + 1) / total) * 100));
    }
    setIsBulkDeleting(false);
    setBulkDeleteProgress(0);
    setSelected(new Set());
    if (fail === 0) toast.success(`Deleted ${success} URL(s)`);
    else if (success > 0) toast.warning(`${success} deleted, ${fail} failed`);
    else toast.error(`Failed to delete ${fail} URL(s)`);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Urlify</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw className="size-4" /> Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={selected.size === 0}
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="size-4" /> Delete
            {selected.size > 0 ? ` (${selected.size})` : ''}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={checkedValue}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Short Code</TableHead>
              <TableHead>Original URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {urls.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No URLs found.
                </TableCell>
              </TableRow>
            ) : (
              urls.map(url => {
                const status = getUrlStatus(url);
                return (
                  <TableRow key={url.shortCode}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(url.shortCode)}
                        onCheckedChange={() => toggleOne(url.shortCode)}
                        aria-label="Select row"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <a
                        href={url.shortUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {url.shortCode}
                        <ExternalLink className="size-3" />
                      </a>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      <span title={url.originalUrl}>{url.originalUrl}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={status === 'active' ? 'secondary' : 'outline'}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(url.createdAt)}
                    </TableCell>
                    <TableCell>
                      <ActionButton
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive hover:text-white"
                        isLoading={deletingId === url.shortCode}
                        onClick={() => deleteOne(url.shortCode)}
                        aria-label="Delete"
                        leftIcon={<Trash2 />}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Rows per page</span>
          <Select
            value={String(limit)}
            onValueChange={v => changePageSize(Number(v))}
          >
            <SelectTrigger className="h-8 w-[70px]" size="sm">
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
        </div>

        <UrlifyPagination
          page={viewedPage}
          knownPages={knownPages}
          hasMoreBeyondKnown={hasMoreBeyondKnown}
          onPageChange={onPageChange}
        />
      </div>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} URL(s)?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected short codes will stop
              resolving.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkDeleting}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Deleting URLs...</DialogTitle>
            <DialogDescription>
              Please wait while the selected URLs are being deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{ width: `${bulkDeleteProgress}%` }}
              />
            </div>
            <p className="text-muted-foreground text-sm text-right">
              {bulkDeleteProgress}% complete
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type PaginationProps = {
  page: number;
  knownPages: number;
  hasMoreBeyondKnown: boolean;
  onPageChange: (n: number) => void;
};

function UrlifyPagination({
  page,
  knownPages,
  hasMoreBeyondKnown,
  onPageChange,
}: PaginationProps) {
  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= knownPages; i++) pages.push(i);
    return pages;
  }, [knownPages]);

  const canGoBack = page > 1;
  const canGoForward = page < knownPages || hasMoreBeyondKnown;

  return (
    <nav
      aria-label="pagination"
      className="flex items-center justify-end gap-1"
    >
      <Button
        variant="ghost"
        size="sm"
        disabled={!canGoBack}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="size-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>
      {visiblePages.map(n => (
        <Button
          key={n}
          variant={n === page ? 'outline' : 'ghost'}
          size="sm"
          className="min-w-9"
          onClick={() => onPageChange(n)}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </Button>
      ))}
      {hasMoreBeyondKnown && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => onPageChange(knownPages + 1)}
        >
          …
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={!canGoForward}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRightIcon className="size-4" />
      </Button>
    </nav>
  );
}
