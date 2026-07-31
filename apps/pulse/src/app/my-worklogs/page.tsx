'use client';

import { useEffect, useMemo } from 'react';

import { ActionButton } from '@workspace/ui/components/action-button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { Label } from '@workspace/ui/components/label';
import { NativeSelect } from '@workspace/ui/components/native-select';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Spinner } from '@workspace/ui/components/spinner';
import { Search } from 'lucide-react';

import { BulkDeleteAction } from '@/components/features/timesheet/bulk-delete-action';
import { EditWorklogModal } from '@/components/features/timesheet/edit-worklog-modal';
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
          <ToolPageHeader
            title="My Worklogs"
            subtitle={
              hasSearched && worklogs.length > 0 ? (
                <p className="text-sm text-muted-foreground mt-1">
                  {worklogs.length} record{worklogs.length !== 1 ? 's' : ''}{' '}
                  &middot; {formatHours(totalHours)} total hours
                </p>
              ) : undefined
            }
          />

          <NotConfiguredAlert isConfigured={isConfigured} />

          {isConfigured && <TokenExpiredAlert authError={authError} />}

          {/* Inline filter bar */}
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="date-range">Date Range</Label>
              <DateRangePicker
                id="date-range"
                from={fromDate}
                to={toDate}
                onRangeChange={(from, to) => {
                  setFromDate(from);
                  setToDate(to);
                }}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status-select">Status</Label>
              <NativeSelect
                id="status-select"
                value={statusWorklog}
                onChange={e => setStatusWorklog(e.target.value)}
                disabled={!isConfigured}
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <ActionButton
              onClick={handleSearch}
              disabled={!isConfigured}
              leftIcon={<Search />}
              isLoading={isLoading}
              loadingText="Searching…"
            >
              Search
            </ActionButton>
          </div>

          {/* Select-all + bulk delete bar */}
          {worklogs.length > 0 && (
            <div className="flex items-center justify-between h-8">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? 'indeterminate' : false
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
                <span className="text-sm text-muted-foreground">
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
          {isLoading && (
            <div className="rounded-lg border overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
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
            </div>
          )}

          {/* Empty state */}
          {!isLoading && worklogs.length === 0 && hasSearched && (
            <p className="text-center text-muted-foreground py-10">
              No worklogs found for the selected filters.
            </p>
          )}

          {/* Grouped results */}
          {!isLoading && dateGroups.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              {dateGroups.map(group => (
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
            </div>
          )}

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
