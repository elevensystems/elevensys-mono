'use client';

import * as React from 'react';

import { Search } from 'lucide-react';

import { ActionButton } from '@workspace/ui/components/action-button';
import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import MainLayout from '@/components/layouts/main-layout';
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
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
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
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useProjectWorklogs } from '@/hooks/use-project-worklogs';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';

import { TimesheetPagination } from '../_components/timesheet-pagination';
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
    projects,
    projectsLoading,
    selectedProject,
    setSelectedProject,
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
    pageStart,
    pageEnd,
    handleSearch,
    goToPage,
  } = useProjectWorklogs({ settings, isConfigured });

  const uniqueContributors = React.useMemo(
    () => new Set(rows.map(r => r.user)).size,
    [rows]
  );

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
            title="Project Worklogs"
            subtitle={
              <>
                {hasSearched && totalRecords > 0 && selectedProject && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProject.name} &middot;{' '}
                    {totalRecords} record{totalRecords !== 1 ? 's' : ''}
                    {uniqueContributors > 0 &&
                      ` · ${uniqueContributors} contributor${uniqueContributors !== 1 ? 's' : ''} on this page`}
                  </p>
                )}
                {error && (
                  <p className="text-sm text-destructive mt-1">{error}</p>
                )}
              </>
            }
          />

          <NotConfiguredAlert isConfigured={isConfigured} />

          {/* Filters */}
          <div className="space-y-4">
            {/* Row 1: primary filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr_1fr] gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="project-select">
                  Project <span className="text-destructive">*</span>
                </Label>
                <NativeSelect
                  id="project-select"
                  value={selectedProject?.id ?? ''}
                  onChange={e => {
                    const project =
                      projects.find(p => p.id === e.target.value) ?? null;
                    setSelectedProject(project);
                  }}
                  disabled={!isConfigured || projectsLoading}
                >
                  <option value="">
                    {projectsLoading
                      ? 'Loading projects…'
                      : 'Select a project'}
                  </option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.key})
                    </option>
                  ))}
                </NativeSelect>
              </div>

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
                <Label htmlFor="username-input">Username</Label>
                <Input
                  id="username-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="All users"
                  disabled={!isConfigured}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="type-of-work-select">Type of Work</Label>
                <NativeSelect
                  id="type-of-work-select"
                  value={typeOfWork}
                  onChange={e => setTypeOfWork(e.target.value)}
                  disabled={!isConfigured}
                >
                  {TYPE_OF_WORK_OPTIONS.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            {/* Row 2: secondary filters + action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[5fr_1fr] gap-4 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="status-combobox">Status</Label>
                <div>
                  <Combobox
                    id="status-combobox"
                    multiple
                    autoHighlight
                    items={STATUS_OPTIONS}
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                    disabled={!isConfigured}
                  >
                    <ComboboxChips
                      ref={statusAnchor}
                      className="w-full min-h-9"
                    >
                      <ComboboxValue>
                        {values => (
                          <React.Fragment>
                            {(values as string[]).map(v => (
                              <ComboboxChip key={v}>{v}</ComboboxChip>
                            ))}
                            <ComboboxChipsInput
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
                </div>
              </div>

              <div className="flex items-end">
                <ActionButton
                  onClick={handleSearch}
                  disabled={!isConfigured || !selectedProject}
                  className="w-full"
                  leftIcon={<Search />}
                  isLoading={isLoading}
                  loadingText="Searching…"
                >
                  Search
                </ActionButton>
              </div>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="overflow-hidden rounded-lg border">
              <Table className="table-fixed">
                <TableHeader className="sticky bg-muted/50 top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[48px]">No</TableHead>
                    <TableHead className="w-[130px]">User</TableHead>
                    <TableHead className="w-[156px]">Key</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[80px] text-right">Hours</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, i) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              {hasSearched ? (
                <p>No worklogs found for the selected filters.</p>
              ) : (
                <p>
                  Select a project and date range, then click &quot;Search&quot;
                  to view project worklogs.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <Table className="table-fixed">
                  <TableHeader className="sticky bg-muted/50 top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[48px]">No</TableHead>
                      <TableHead className="w-[130px]">User</TableHead>
                      <TableHead className="w-[156px]">Key</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[80px] text-right">Hours</TableHead>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(row => (
                      <ProjectWorklogRow key={row.id} row={row} />
                    ))}
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
        </div>
      </section>
    </MainLayout>
  );
}
