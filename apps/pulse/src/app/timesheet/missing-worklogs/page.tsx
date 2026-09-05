'use client';

import * as React from 'react';

import { Button } from '@workspace/ui/components/button';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { Panel, PanelBody, PanelHeader } from '@workspace/ui/components/panel';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Spinner } from '@workspace/ui/components/spinner';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Search } from 'lucide-react';

import { FilterBar } from '@/components/features/timesheet/filter-bar';
import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import { TokenExpiredAlert } from '@/components/features/timesheet/token-expired-alert';
import { UserSelector } from '@/components/features/timesheet/user-selector';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useMissingWorklogsReport } from '@/hooks/use-missing-worklogs-report';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';

import { MissingUserRow } from './_components/missing-user-row';

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

  // One line, every state: the header keeps its subtitle while a search runs
  // and when it comes back empty, so nothing below it shifts.
  const subtitle = React.useMemo(() => {
    if (error) return <span className="text-destructive">{error}</span>;
    if (!selectedProject)
      return 'See who on a project has not logged work for a date range.';
    if (isLoading) return `${selectedProject.name} · Searching…`;
    if (!hasSearched) return selectedProject.name;
    if (rows.length === 0)
      return `${selectedProject.name} · Everyone logged work for this range`;

    return `${selectedProject.name} · ${rows.length} user${rows.length !== 1 ? 's' : ''} · ${totalMissingDays} missing day${totalMissingDays !== 1 ? 's' : ''}`;
  }, [
    error,
    selectedProject,
    isLoading,
    hasSearched,
    rows.length,
    totalMissingDays,
  ]);

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
          <ToolPageHeader title="Missing Worklogs" subtitle={subtitle} />

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
            </PanelHeader>

            {/* Results */}
            <PanelBody>
              {showTable ? (
                <Table className="table-fixed">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[48px]">No</TableHead>
                      <TableHead className="w-[200px]">User</TableHead>
                      <TableHead className="w-[120px] text-center">
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
                              <Skeleton className="h-7 w-8 mx-auto" />
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
                <div className="flex flex-col items-center justify-center h-40 text-sm text-muted-foreground">
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
            </PanelBody>
          </Panel>
        </div>
      </section>
    </MainLayout>
  );
}
