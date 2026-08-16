'use client';

import * as React from 'react';

import { Button } from '@workspace/ui/components/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@workspace/ui/components/combobox';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { Frame, FrameHeader, FramePanel } from '@workspace/ui/components/frame';
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
import { Search } from 'lucide-react';

import { FilterBar } from '@/components/features/timesheet/filter-bar';
import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import { TimesheetPagination } from '@/components/features/timesheet/timesheet-pagination';
import { TokenExpiredAlert } from '@/components/features/timesheet/token-expired-alert';
import { UserSelector } from '@/components/features/timesheet/user-selector';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useProjectWorklogs } from '@/hooks/use-project-worklogs';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';

import { ProjectWorklogRow } from './_components/project-worklog-row';

const TYPE_OF_WORK_OPTIONS = [
  'All',
  'Create',
  'Study',
  'Review',
  'Correct',
  'Test',
  'Translate',
];

const STATUS_OPTIONS = ['Pending', 'Reopened', 'Approved', 'Rejected'] as const;

export default function ProjectWorklogsPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();
  const statusAnchor = useComboboxAnchor();

  const {
    authError,
    selectedProject,
    username,
    setUsername,
    typeOfWork,
    setTypeOfWork,
    filterStatus,
    setFilterStatus,
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
  } = useProjectWorklogs({ settings, isConfigured });

  const uniqueContributors = React.useMemo(
    () => new Set(rows.map(r => r.user)).size,
    [rows]
  );

  // One line, every state: the header keeps its subtitle while a search runs
  // and when it comes back empty, so nothing below it shifts.
  const subtitle = React.useMemo(() => {
    if (error) return <span className="text-destructive">{error}</span>;
    if (!selectedProject)
      return 'Choose a project in the header to get started.';
    if (isLoading) return `${selectedProject.name} · Searching…`;
    if (!hasSearched) return selectedProject.name;
    if (totalRecords === 0)
      return `${selectedProject.name} · No worklogs for this range`;

    const contributorLabel =
      uniqueContributors > 0
        ? ` · ${uniqueContributors} contributor${uniqueContributors !== 1 ? 's' : ''} on this page`
        : '';
    return `${selectedProject.name} · ${totalRecords} record${totalRecords !== 1 ? 's' : ''}${contributorLabel}`;
  }, [
    error,
    selectedProject,
    isLoading,
    hasSearched,
    totalRecords,
    uniqueContributors,
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

  // The table carries the results while loading too, so the skeleton keeps the
  // column layout instead of collapsing to a bare message.
  const showTable = isLoading || rows.length > 0;

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto space-y-6">
          {/* Header */}
          <ToolPageHeader title="Project Worklogs" subtitle={subtitle} />

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

                <NativeSelect
                  aria-label="Type of Work"
                  value={typeOfWork}
                  onChange={e => setTypeOfWork(e.target.value)}
                  disabled={!isConfigured}
                  containerClassName="w-full sm:w-44"
                >
                  {TYPE_OF_WORK_OPTIONS.map(type => (
                    <option key={type} value={type}>
                      {type === 'All' ? 'All types' : type}
                    </option>
                  ))}
                </NativeSelect>

                {/* Chips grow with the selection, so this one takes the slack
                    rather than a fixed width. */}
                <Combobox
                  multiple
                  autoHighlight
                  items={STATUS_OPTIONS}
                  value={filterStatus}
                  onValueChange={setFilterStatus}
                  disabled={!isConfigured}
                >
                  <ComboboxChips
                    ref={statusAnchor}
                    className="bg-background min-h-9 w-full sm:w-auto sm:min-w-48 sm:flex-1"
                  >
                    <ComboboxValue>
                      {values => (
                        <React.Fragment>
                          {(values as string[]).map(v => (
                            <ComboboxChip key={v}>{v}</ComboboxChip>
                          ))}
                          <ComboboxChipsInput
                            aria-label="Status"
                            placeholder={
                              filterStatus.length === 0
                                ? 'All statuses'
                                : undefined
                            }
                          />
                        </React.Fragment>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={statusAnchor}>
                    <ComboboxEmpty>No statuses found.</ComboboxEmpty>
                    <ComboboxList>
                      {item => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !isConfigured || !selectedProject}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? <Spinner /> : <Search />}
                  {isLoading ? 'Searching…' : 'Search'}
                </Button>
              </FilterBar>
            </FrameHeader>

            {/* Results — flush inside the frame, keeping its radius. */}
            <FramePanel rounded className="gap-0 overflow-hidden p-0">
              {showTable ? (
                <Table className="table-fixed">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[48px]">No</TableHead>
                      <TableHead className="w-[130px]">User</TableHead>
                      <TableHead className="w-[156px]">Key</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[80px] text-right">
                        Hours
                      </TableHead>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading
                      ? Array.from({ length: 8 }).map((_, i) => (
                          <TableRow key={i}>
                            <td className="p-2 pl-4">
                              <Skeleton className="h-4 w-6" />
                            </td>
                            <td className="p-2">
                              <Skeleton className="h-4 w-20" />
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
                          </TableRow>
                        ))
                      : rows.map(row => (
                          <ProjectWorklogRow key={row.id} row={row} />
                        ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  {!selectedProject ? (
                    <p>Choose a project in the header to get started.</p>
                  ) : hasSearched ? (
                    <p>No worklogs found for the selected filters.</p>
                  ) : (
                    <p>
                      Pick a date range, then click &quot;Search&quot; to view
                      project worklogs.
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
