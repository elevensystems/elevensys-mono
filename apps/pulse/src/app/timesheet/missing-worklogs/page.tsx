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
import { TokenExpiredAlert } from '@/components/features/timesheet/token-expired-alert';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useMissingWorklogsReport } from '@/hooks/use-missing-worklogs-report';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { formatDateForApi } from '@/lib/timesheet';
import type { JiraProject } from '@/types/timesheet';

import { MissingUserRow } from './_components/missing-user-row';
import { buildMissingSummary } from './_components/missing-worklogs-utils';

export default function MissingWorklogsPage() {
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
    handleSearch,
  } = useMissingWorklogsReport({ settings, isConfigured });

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

  const totalMissingDays = React.useMemo(
    () => rows.reduce((sum, row) => sum + row.count, 0),
    [rows]
  );

  const handleCopySummary = React.useCallback(async () => {
    const summary = buildMissingSummary({
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
                    See who on a project has not logged work for a date range.
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
                <TableHeader className="sticky bg-muted/50 top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[48px]">No</TableHead>
                    <TableHead className="w-[200px]">User</TableHead>
                    <TableHead className="w-[80px] text-right">Days</TableHead>
                    <TableHead>Missing dates</TableHead>
                  </TableRow>
                </TableHeader>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              {hasSearched ? (
                <p>No missing worklogs for this range.</p>
              ) : (
                <p>
                  Select a project and date range, then click &quot;Search&quot;
                  to see who is missing worklogs.
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
                    {rows.map((row, index) => (
                      <MissingUserRow
                        key={row.username}
                        no={index + 1}
                        user={row}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
