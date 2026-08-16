'use client';

import * as React from 'react';

import { Button } from '@workspace/ui/components/button';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { Frame, FrameHeader, FramePanel } from '@workspace/ui/components/frame';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Spinner } from '@workspace/ui/components/spinner';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Copy, Search } from 'lucide-react';
import { toast } from 'sonner';

import { FilterBar } from '@/components/features/timesheet/filter-bar';
import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import { TimesheetPagination } from '@/components/features/timesheet/timesheet-pagination';
import { TokenExpiredAlert } from '@/components/features/timesheet/token-expired-alert';
import { UserSelector } from '@/components/features/timesheet/user-selector';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useAbsences } from '@/hooks/use-absences';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { formatDateForApi } from '@/lib/timesheet';

import { AbsenceRow } from './_components/absence-row';
import { buildAbsencesSummary } from './_components/absences-utils';

const COLUMNS = [
  { label: 'No', className: 'w-[48px]' },
  { label: 'User', className: 'w-[220px]' },
  { label: 'From', className: 'w-[130px]' },
  { label: 'To', className: 'w-[130px]' },
  { label: 'Type', className: 'w-[150px]' },
  { label: 'Days', className: 'w-[80px] text-right' },
  { label: 'Status', className: 'w-[120px]' },
  { label: 'Reason', className: '' },
] as const;

function AbsencesTableHeader() {
  return (
    <TableHeader className="sticky top-0 z-10">
      <TableRow>
        {COLUMNS.map(column => (
          <TableHead key={column.label} className={column.className}>
            {column.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

export default function AbsencesPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();

  const {
    authError,
    selectedProject,
    username,
    setUsername,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    rows,
    isLoading,
    error,
    hasSearched,
    currentPage,
    totalPages,
    totalRecords,
    handleSearch,
    goToPage,
  } = useAbsences({ settings, isConfigured });

  // One line, every state: the header keeps its subtitle while a search runs
  // and when it comes back empty, so nothing below it shifts.
  const subtitle = React.useMemo(() => {
    if (error) return <span className="text-destructive">{error}</span>;
    if (!selectedProject)
      return 'See who on a project is on leave for a date range.';
    if (isLoading) return `${selectedProject.name} · Searching…`;
    if (!hasSearched) return selectedProject.name;
    if (totalRecords === 0)
      return `${selectedProject.name} · No absences for this range`;

    const pageLabel =
      totalPages > 1 ? ` · page ${currentPage} of ${totalPages}` : '';
    return `${selectedProject.name} · ${totalRecords} absence${totalRecords !== 1 ? 's' : ''}${pageLabel}`;
  }, [
    error,
    selectedProject,
    isLoading,
    hasSearched,
    totalRecords,
    totalPages,
    currentPage,
  ]);

  const handleCopySummary = React.useCallback(async () => {
    const summary = buildAbsencesSummary({
      rows,
      projectLabel: selectedProject ? selectedProject.name : 'Project',
      startDate: formatDateForApi(fromDate),
      endDate: formatDateForApi(toDate),
    });

    try {
      await navigator.clipboard.writeText(summary);
      toast.success('Summary copied to clipboard');
    } catch {
      toast.error('Failed to copy summary');
    }
  }, [rows, selectedProject, fromDate, toDate]);

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

  const showTable = isLoading || rows.length > 0;

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto space-y-6">
          <ToolPageHeader title="Absences" subtitle={subtitle} />

          <NotConfiguredAlert isConfigured={isConfigured} />

          {isConfigured && <TokenExpiredAlert authError={authError} />}

          <Frame dense>
            {/* Filters */}
            <FrameHeader className="gap-3">
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

                <UserSelector
                  aria-label="User"
                  value={username}
                  onChange={setUsername}
                  disabled={!isConfigured}
                  className="w-full sm:w-72"
                />

                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !isConfigured || !selectedProject}
                  className="w-full sm:ml-auto sm:w-auto"
                >
                  {isLoading ? <Spinner /> : <Search />}
                  {isLoading ? 'Searching…' : 'Search'}
                </Button>
              </FilterBar>
            </FrameHeader>

            {/* Results — flush inside the frame, keeping its radius. Copy
                summary sits in the panel's own toolbar, directly above the rows
                it summarises. */}
            <FramePanel rounded className="gap-0 overflow-hidden p-0">
              {!isLoading && rows.length > 0 && (
                <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Absences
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={handleCopySummary}
                  >
                    <Copy />
                    Copy summary
                  </Button>
                </div>
              )}

              {showTable ? (
                <Table className="table-fixed">
                  <AbsencesTableHeader />
                  <TableBody>
                    {isLoading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            <td className="p-2 pl-4">
                              <Skeleton className="h-4 w-6" />
                            </td>
                            <td className="p-2">
                              <Skeleton className="h-4 w-28" />
                            </td>
                            <td className="p-2">
                              <Skeleton className="h-4 w-20" />
                            </td>
                            <td className="p-2">
                              <Skeleton className="h-4 w-20" />
                            </td>
                            <td className="p-2">
                              <Skeleton className="h-5 w-24 rounded-full" />
                            </td>
                            <td className="p-2">
                              <Skeleton className="h-4 w-6 ml-auto" />
                            </td>
                            <td className="p-2">
                              <Skeleton className="h-5 w-20 rounded-full" />
                            </td>
                            <td className="p-2">
                              <Skeleton className="h-4 w-40" />
                            </td>
                          </TableRow>
                        ))
                      : rows.map((row, index) => (
                          <AbsenceRow
                            key={
                              row.id ??
                              `${row.username}-${row.fromDate}-${index}`
                            }
                            no={index + 1}
                            absence={row}
                          />
                        ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  {!selectedProject ? (
                    <p>Choose a project in the header to get started.</p>
                  ) : hasSearched ? (
                    <p>No absences for this range.</p>
                  ) : (
                    <p>
                      Pick a date range, then click &quot;Search&quot; to see
                      who is on leave.
                    </p>
                  )}
                </div>
              )}
            </FramePanel>
          </Frame>

          {!isLoading && rows.length > 0 && (
            <TimesheetPagination
              currentPage={currentPage}
              totalPages={totalPages}
              isLoading={isLoading}
              onPageChange={goToPage}
            />
          )}
        </div>
      </section>
    </MainLayout>
  );
}
