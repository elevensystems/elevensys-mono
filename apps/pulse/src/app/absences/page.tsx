'use client';

import * as React from 'react';

import { Button } from '@workspace/ui/components/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@workspace/ui/components/combobox';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { Input } from '@workspace/ui/components/input';
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
import { TimesheetPagination } from '@/components/features/timesheet/timesheet-pagination';
import { TokenExpiredAlert } from '@/components/features/timesheet/token-expired-alert';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useAbsences } from '@/hooks/use-absences';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { formatDateForApi } from '@/lib/timesheet';
import type { JiraProject } from '@/types/timesheet';

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
    <TableHeader className="sticky bg-muted/50 top-0 z-10">
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
    projects,
    projectsLoading,
    authError,
    selectedProject,
    setSelectedProject,
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

  const [projectSearch, setProjectSearch] = React.useState('');

  const handleProjectInputChange = React.useCallback(
    (value: string, eventDetails: { reason: string }) => {
      if (eventDetails.reason === 'input-clear') return;
      setProjectSearch(value);
    },
    []
  );

  const handleProjectSelect = React.useCallback(
    (value: JiraProject | null) => {
      setSelectedProject(value);
      setProjectSearch('');
    },
    [setSelectedProject]
  );

  const handleCopySummary = React.useCallback(async () => {
    const summary = buildAbsencesSummary({
      rows,
      projectLabel: selectedProject
        ? `${selectedProject.key} — ${selectedProject.name}`
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

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto space-y-6">
          <ToolPageHeader
            title="Absences"
            subtitle={
              <>
                {hasSearched && rows.length > 0 && selectedProject && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedProject.name} &middot; {totalRecords} absence
                    {totalRecords !== 1 ? 's' : ''}
                    {totalPages > 1 && (
                      <>
                        {' '}
                        &middot; page {currentPage} of {totalPages}
                      </>
                    )}
                  </p>
                )}
                {!hasSearched && (
                  <p className="text-sm text-muted-foreground mt-1">
                    See who on a project is on leave for a date range.
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

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr_auto] gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="project-select">
                Project <span className="text-destructive">*</span>
              </Label>
              <Combobox
                items={projects}
                value={selectedProject}
                inputValue={
                  selectedProject
                    ? `${selectedProject.key} — ${selectedProject.name}`
                    : projectSearch
                }
                onInputValueChange={handleProjectInputChange}
                onValueChange={handleProjectSelect}
                itemToStringLabel={(project: JiraProject) =>
                  `${project.key} — ${project.name}`
                }
              >
                <ComboboxInput
                  id="project-select"
                  placeholder={
                    projectsLoading
                      ? 'Loading projects...'
                      : 'Search project...'
                  }
                  className="w-full"
                  disabled={!isConfigured || projectsLoading}
                  loading={projectsLoading}
                  showClear
                />
                <ComboboxContent>
                  <ComboboxList>
                    {(project: JiraProject) => (
                      <ComboboxItem key={project.id} value={project}>
                        <span className="font-medium shrink-0">
                          {project.key}
                        </span>
                        <span className="text-muted-foreground truncate">
                          — {project.name}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                  <ComboboxEmpty>No projects found</ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
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

            <Button
              onClick={handleSearch}
              disabled={isLoading || !isConfigured || !selectedProject}
              className="w-full lg:w-auto"
            >
              {isLoading ? <Spinner /> : <Search />}
              {isLoading ? 'Searching…' : 'Search'}
            </Button>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="overflow-hidden rounded-lg border">
              <Table className="table-fixed">
                <AbsencesTableHeader />
                <TableBody>
                  {Array.from({ length: 6 }).map((_, i) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              {hasSearched ? (
                <p>No absences for this range.</p>
              ) : (
                <p>
                  Select a project and date range, then click &quot;Search&quot;
                  to see who is on leave.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleCopySummary}>
                  <Copy />
                  Copy summary
                </Button>
              </div>

              <div className="overflow-hidden rounded-lg border">
                <Table className="table-fixed">
                  <AbsencesTableHeader />
                  <TableBody>
                    {rows.map((row, index) => (
                      <AbsenceRow
                        key={
                          row.id ?? `${row.username}-${row.fromDate}-${index}`
                        }
                        no={index + 1}
                        absence={row}
                      />
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
