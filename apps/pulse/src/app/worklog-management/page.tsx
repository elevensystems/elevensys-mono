'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { NativeSelect } from '@workspace/ui/components/native-select';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Spinner } from '@workspace/ui/components/spinner';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { ClipboardList, Search } from 'lucide-react';

import { BulkDeleteAction } from '@/components/features/timesheet/bulk-delete-action';
import { EditWorklogModal } from '@/components/features/timesheet/edit-worklog-modal';
import { FilterBar } from '@/components/features/timesheet/filter-bar';
import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import { TimesheetPagination } from '@/components/features/timesheet/timesheet-pagination';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { getWorklogKey, useWorklogs } from '@/hooks/use-worklogs';

import { WorklogRow } from './_components/worklog-row';

const STATUS_OPTIONS = ['All', 'Pending', 'Reopened', 'Approved', 'Rejected'];

export default function WorklogManagementPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();

  const {
    selectedProject,
    statusWorklog,
    setStatusWorklog,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    worklogs,
    isLoading,
    deletingId,
    error,
    hasSearched,
    totalHours,
    currentPage,
    totalPages,
    totalRecords,
    pageStart,
    pageEnd,
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
    goToPage,
    handleDelete,
    handleBulkDelete,
    cancelBulkDelete,
  } = useWorklogs({ settings, isConfigured });

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
        <div className="max-w-full mx-auto space-y-8">
          <ToolPageHeader
            title="Worklog Management"
            description="Search and manage logged timesheets from Jira by project. View, edit, and delete work entries with pagination support."
            error={error || undefined}
          />

          <NotConfiguredAlert isConfigured={isConfigured} />

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Worklogs
              </CardTitle>
              <CardDescription>
                {selectedProject
                  ? `${selectedProject.name}. Pick a date range and status, then click "Search".`
                  : 'Choose a project in the sidebar, then pick a date range and status.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  disabled={isLoading || !isConfigured || !selectedProject}
                  className="w-full sm:ml-auto sm:w-auto"
                >
                  {isLoading ? <Spinner /> : <Search />}
                  {isLoading ? 'Searching…' : 'Search'}
                </Button>
              </FilterBar>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Worklogs
              </CardTitle>
              {hasSearched && totalRecords > 0 && (
                <>
                  <CardDescription>
                    {totalRecords} record{totalRecords !== 1 ? 's' : ''}{' '}
                    &middot; {totalHours.toFixed(1)} total hours &middot; page{' '}
                    {currentPage} of {totalPages} (entries {pageStart}–{pageEnd}
                    )
                  </CardDescription>
                  <BulkDeleteAction
                    selectedCount={selectedIds.size}
                    isBulkDeleting={isBulkDeleting}
                    bulkDeleteProgress={bulkDeleteProgress}
                    onBulkDelete={handleBulkDelete}
                    onClearSelection={clearSelection}
                    onCancelBulkDelete={cancelBulkDelete}
                  />
                </>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted/50 top-0 z-10">
                      <TableRow>
                        <TableHead className="w-[40px]" />
                        <TableHead>Key</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          <td className="p-2 pl-4">
                            <Skeleton className="h-4 w-4" />
                          </td>
                          <td className="p-2">
                            <Skeleton className="h-4 w-28" />
                          </td>
                          <td className="p-2">
                            <Skeleton className="h-4 w-40" />
                          </td>
                          <td className="p-2 text-right">
                            <Skeleton className="h-4 w-10 ml-auto" />
                          </td>
                          <td className="p-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </td>
                          <td className="p-2">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="p-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </td>
                          <td className="p-2">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="p-2">
                            <Skeleton className="h-4 w-8" />
                          </td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : worklogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  {!selectedProject ? (
                    <p>Choose a project in the header to get started.</p>
                  ) : hasSearched ? (
                    <p>No worklogs found for the selected filters.</p>
                  ) : (
                    <p>
                      Pick a date range, then click &quot;Search&quot; to view
                      your worklogs.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader className="bg-muted/50 top-0 z-10">
                        <TableRow>
                          <TableHead className="w-[40px]">
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
                          </TableHead>
                          <TableHead>Key</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead className="w-[60px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {worklogs.map(worklog => {
                          const key = getWorklogKey(worklog);
                          return (
                            <WorklogRow
                              key={key}
                              worklog={worklog}
                              isSelected={selectedIds.has(key)}
                              isDeleting={deletingId === key}
                              onToggleSelect={toggleSelect}
                              onDelete={handleDelete}
                              onEdit={openEditModal}
                            />
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <TimesheetPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    isLoading={isLoading}
                    onPageChange={goToPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
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
