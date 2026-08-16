'use client';

import * as React from 'react';

import { Button } from '@workspace/ui/components/button';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { Frame, FrameHeader, FramePanel } from '@workspace/ui/components/frame';
import { Label } from '@workspace/ui/components/label';
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

import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import { TokenExpiredAlert } from '@/components/features/timesheet/token-expired-alert';
import { UserSelector } from '@/components/features/timesheet/user-selector';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useMissingWorklogsReport } from '@/hooks/use-missing-worklogs-report';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { formatDateForApi } from '@/lib/timesheet';

import { MissingUserRow } from './_components/missing-user-row';
import { buildMissingSummary } from './_components/missing-worklogs-utils';

export default function MissingWorklogsPage() {
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
    handleSearch,
  } = useMissingWorklogsReport({ settings, isConfigured });

  const totalMissingDays = React.useMemo(
    () => rows.reduce((sum, row) => sum + row.count, 0),
    [rows]
  );

  const handleCopySummary = React.useCallback(async () => {
    const summary = buildMissingSummary({
      rows,
      projectLabel: selectedProject
        ? selectedProject.name
        : 'Project',
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
          <ToolPageHeader
            title="Missing Worklogs"
            subtitle={
              <>
                {hasSearched && rows.length > 0 && selectedProject && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProject.name} &middot; {rows.length} user
                    {rows.length !== 1 ? 's' : ''} &middot; {totalMissingDays}{' '}
                    missing day{totalMissingDays !== 1 ? 's' : ''}
                  </p>
                )}
                {!hasSearched && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProject
                      ? selectedProject.name
                      : 'See who on a project has not logged work for a date range.'}
                  </p>
                )}
                {error && (
                  <p className="text-sm text-destructive mt-1">{error}</p>
                )}
              </>
            }
          />

          <NotConfiguredAlert isConfigured={isConfigured} />

          {isConfigured && <TokenExpiredAlert authError={authError} />}

          <Frame dense>
            {/* Filters */}
            <FrameHeader className="gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto] gap-3 items-end">
                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="username-input">User</Label>
                  <UserSelector
                    id="username-input"
                    value={username}
                    onChange={setUsername}
                    disabled={!isConfigured}
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !isConfigured || !selectedProject}
                  className="w-full lg:w-auto"
                >
                  {isLoading ? <Spinner /> : <Search />}
                  {isLoading ? 'Searching…' : 'Search'}
                </Button>
              </div>
            </FrameHeader>

            {/* Results — flush inside the frame, keeping its radius. Copy
                summary sits in the panel's own toolbar, directly above the rows
                it summarises. */}
            <FramePanel rounded className="gap-0 overflow-hidden p-0">
              {!isLoading && rows.length > 0 && (
                <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Users missing worklogs
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
                  <TableHeader className="sticky bg-muted/50 top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[48px]">No</TableHead>
                      <TableHead className="w-[200px]">User</TableHead>
                      <TableHead className="w-[80px] text-right">
                        Days
                      </TableHead>
                      <TableHead>Missing dates</TableHead>
                    </TableRow>
                  </TableHeader>
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
                              <Skeleton className="h-5 w-8 ml-auto rounded-full" />
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1.5">
                                {Array.from({ length: 5 }).map((_, j) => (
                                  <Skeleton
                                    key={j}
                                    className="h-5 w-16 rounded-full"
                                  />
                                ))}
                              </div>
                            </td>
                          </TableRow>
                        ))
                      : rows.map((row, index) => (
                          <MissingUserRow
                            key={row.username}
                            no={index + 1}
                            user={row}
                          />
                        ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  {!selectedProject ? (
                    <p>Choose a project in the header to get started.</p>
                  ) : hasSearched ? (
                    <p>No missing worklogs for this range.</p>
                  ) : (
                    <p>
                      Pick a date range, then click &quot;Search&quot; to see
                      who is missing worklogs.
                    </p>
                  )}
                </div>
              )}
            </FramePanel>
          </Frame>
        </div>
      </section>
    </MainLayout>
  );
}
