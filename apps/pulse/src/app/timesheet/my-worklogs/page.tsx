'use client';

import { useEffect, useMemo } from 'react';

import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { NativeSelect } from '@workspace/ui/components/native-select';
import { Panel, PanelBody, PanelHeader } from '@workspace/ui/components/panel';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Spinner } from '@workspace/ui/components/spinner';
import { Search } from 'lucide-react';

import { BulkDeleteAction } from '@/components/features/timesheet/bulk-delete-action';
import { EditWorklogModal } from '@/components/features/timesheet/edit-worklog-modal';
import { FilterBar } from '@/components/features/timesheet/filter-bar';
import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import { TokenExpiredAlert } from '@/components/features/timesheet/token-expired-alert';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useMyWorklogs } from '@/hooks/use-my-worklogs';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { formatDisplayDate, formatHours, parseApiDate } from '@/lib/timesheet';
import type { MyWorklogsRow } from '@/types/timesheet';

import { WorklogDateGroup } from './_components/worklog-date-group';

const STATUS_OPTIONS = ['All', 'Pending', 'Reopened', 'Approved', 'Rejected'];

export default function MyWorklogsPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();

  const {
    statusWorklog,
    setStatusWorklog,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    worklogs,
    isLoading,
    authError,
    hasSearched,
    totalHours,
    deletingId,
    selectedIds,
    allSelected,
    someSelected,
    isBulkDeleting,
    bulkDeleteProgress,
    editingWorklog,
    isEditing,
    openEditModal,
    closeEditModal,
    handleEdit,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    handleSearch,
    handleDelete,
    handleBulkDelete,
    cancelBulkDelete,
  } = useMyWorklogs({ settings, isConfigured });

  useEffect(() => {
    if (isLoaded && isConfigured && !hasSearched && !isLoading) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isConfigured]);

  const dateGroups = useMemo(() => {
    const map = new Map<string, MyWorklogsRow[]>();
    for (const w of worklogs) {
      const key = w.startDateEdit || w.startDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const da = parseApiDate(a) ?? new Date(0);
        const db = parseApiDate(b) ?? new Date(0);
        return db.getTime() - da.getTime();
      })
      .map(([dateKey, rows]) => ({
        dateKey,
        displayDate: formatDisplayDate(dateKey),
        totalHours: rows.reduce((sum, r) => sum + (Number(r.worked) || 0), 0),
        rows,
      }));
  }, [worklogs]);

  // One line, every state: the header keeps its subtitle while a search runs
  // and when it comes back empty, so nothing below it shifts.
  const subtitle = useMemo(() => {
    if (isLoading) return 'Searching…';
    if (!hasSearched) return 'View your logged work for a date range.';
    if (worklogs.length === 0) return 'No worklogs for this range';

    return `${worklogs.length} record${worklogs.length !== 1 ? 's' : ''} · ${formatHours(totalHours)} total hours`;
  }, [isLoading, hasSearched, worklogs.length, totalHours]);

  if (!isLoaded) {
    return (
      <MainLayout>
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-40">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto space-y-6">
          {/* Header */}
          <ToolPageHeader title="My Worklogs" subtitle={subtitle} />

          <NotConfiguredAlert isConfigured={isConfigured} />

          {isConfigured && <TokenExpiredAlert authError={authError} />}

          <Panel>
            {/* Filters */}
            <PanelHeader>
              <FilterBar>
                <DateRangePicker
                  aria-label="Date Range"
                  from={fromDate}
                  to={toDate}
                  onRangeChange={(from, to) => {
                    setFromDate(from);
                    setToDate(to);
                  }}
                  className="w-full sm:w-64"
                />

                <NativeSelect
                  aria-label="Status"
                  value={statusWorklog}
                  onChange={e => setStatusWorklog(e.target.value)}
                  disabled={!isConfigured}
                  containerClassName="w-full sm:w-44"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status === 'All' ? 'All statuses' : status}
                    </option>
                  ))}
                </NativeSelect>

                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !isConfigured}
                  className="w-full sm:ml-auto sm:w-auto"
                >
                  {isLoading ? <Spinner /> : <Search />}
                  {isLoading ? 'Searching…' : 'Search'}
                </Button>
              </FilterBar>
            </PanelHeader>

            {/* Results. Select all and bulk delete sit in the body's own
                toolbar, directly above
                the rows they act on. */}
            <PanelBody>
              {!isLoading && worklogs.length > 0 && (
                <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        allSelected
                          ? true
                          : someSelected
                            ? 'indeterminate'
                            : false
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Select all
                    </span>
                  </div>
                  <BulkDeleteAction
                    selectedCount={selectedIds.size}
                    isBulkDeleting={isBulkDeleting}
                    bulkDeleteProgress={bulkDeleteProgress}
                    onBulkDelete={handleBulkDelete}
                    onClearSelection={clearSelection}
                    onCancelBulkDelete={cancelBulkDelete}
                  />
                </div>
              )}

              {/* Loading skeleton */}
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0"
                  >
                    <Skeleton className="size-4 shrink-0" />
                    <Skeleton className="h-4 w-24 shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-10 shrink-0" />
                    <Skeleton className="h-4 w-16 shrink-0" />
                    <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                    <Skeleton className="size-8 shrink-0" />
                    <Skeleton className="size-8 shrink-0" />
                  </div>
                ))}

              {/* Empty state */}
              {!isLoading && worklogs.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                  {hasSearched
                    ? 'No worklogs found for the selected filters.'
                    : 'Pick a date range and status, then click “Search” to see your worklogs.'}
                </p>
              )}

              {/* Grouped results */}
              {!isLoading &&
                dateGroups.map(group => (
                  <WorklogDateGroup
                    key={group.dateKey}
                    displayDate={group.displayDate}
                    totalHours={group.totalHours}
                    worklogs={group.rows}
                    selectedIds={selectedIds}
                    deletingId={deletingId}
                    onToggleSelect={toggleSelect}
                    onDelete={handleDelete}
                    onEdit={openEditModal}
                  />
                ))}
            </PanelBody>
          </Panel>

          <EditWorklogModal
            worklog={editingWorklog}
            isEditing={isEditing}
            onClose={closeEditModal}
            onSave={handleEdit}
          />
        </div>
      </section>
    </MainLayout>
  );
}
