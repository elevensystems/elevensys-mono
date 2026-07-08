'use client';

import { useCallback, useMemo, useState } from 'react';

import { CalendarPlus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ActionButton } from '@workspace/ui/components/action-button';
import { Calendar } from '@workspace/ui/components/calendar';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@workspace/ui/components/combobox';
import { DateRangePicker } from '@workspace/ui/components/date-range-picker';
import { Label } from '@workspace/ui/components/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import { Token } from '@workspace/ui/components/token';
import { parseApiDate } from '@/lib/timesheet';
import type { JiraProject } from '@/types/timesheet';

import { DateChipList } from './date-chip-list';
import { GlowPulseBox } from './glow-pulse-box';

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

interface MissingWorklogsCardProps {
  projects: JiraProject[];
  selectedProjectId: string;
  onProjectChange: (id: string) => void;
  isLoadingProjects: boolean;
  warningFromDate: string;
  warningToDate: string;
  onWarningFromDateChange: (date: string) => void;
  onWarningToDateChange: (date: string) => void;
  isSearchingWarnings: boolean;
  onSearchWarnings: () => Promise<{ dates: string; count: number } | null>;
  selectedDates: Date[];
  onSelectedDatesChange: (dates: Date[]) => void;
  parsedDates: string[];
  onClearAllDates: () => void;
  includeWeekends: boolean;
  onIncludeWeekendsChange: (value: boolean) => void;
  dateError?: string;
}

export function MissingWorklogsCard({
  projects,
  selectedProjectId,
  onProjectChange,
  isLoadingProjects,
  warningFromDate,
  warningToDate,
  onWarningFromDateChange,
  onWarningToDateChange,
  isSearchingWarnings,
  onSearchWarnings,
  selectedDates,
  onSelectedDatesChange,
  parsedDates,
  onClearAllDates,
  includeWeekends,
  onIncludeWeekendsChange,
  dateError,
}: MissingWorklogsCardProps) {
  const [manualDateKeys, setManualDateKeys] = useState<Set<string>>(new Set());
  const [projectSearch, setProjectSearch] = useState('');

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const handleProjectInputChange = useCallback(
    (value: string, eventDetails: { reason: string }) => {
      if (eventDetails.reason === 'input-clear') return;
      setProjectSearch(value);
    },
    []
  );

  const handleProjectSelect = useCallback(
    (value: JiraProject | null) => {
      onProjectChange(value?.id ?? '');
      setProjectSearch('');
    },
    [onProjectChange]
  );

  const handleRemoveDate = (date: Date) => {
    onSelectedDatesChange(
      selectedDates.filter(d => d.getTime() !== date.getTime())
    );
    setManualDateKeys(prev => {
      const next = new Set(prev);
      next.delete(toDateKey(date));
      return next;
    });
  };

  const handleClearAll = () => {
    onClearAllDates();
    setManualDateKeys(new Set());
  };

  const handleCalendarSelect = (newDates: Date[] | undefined) => {
    const next = newDates ?? [];
    const prevKeys = new Set(selectedDates.map(toDateKey));
    const addedKeys = next
      .filter(d => !prevKeys.has(toDateKey(d)))
      .map(toDateKey);
    const removedKeys = selectedDates
      .filter(d => !next.some(n => n.getTime() === d.getTime()))
      .map(toDateKey);
    setManualDateKeys(prev => {
      const updated = new Set(prev);
      addedKeys.forEach(k => updated.add(k));
      removedKeys.forEach(k => updated.delete(k));
      return updated;
    });
    onSelectedDatesChange(next);
  };

  const handleSearchClick = async () => {
    const result = await onSearchWarnings();
    if (result === null) return;

    const dates = result.dates
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(parseApiDate)
      .filter((d): d is Date => {
        if (d === null) return false;
        if (!includeWeekends && isWeekend(d)) return false;
        return true;
      });
    onSelectedDatesChange(dates);
    setManualDateKeys(new Set());
    if (dates.length > 0) {
      toast.success(`Found ${dates.length} missing date${dates.length !== 1 ? 's' : ''}`);
    } else {
      toast.info('No missing dates found.');
    }
  };

  return (
    <div className="space-y-6">
        {/* Step 1 — Search Controls */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            1
          </span>
          Select project &amp; date range
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="project-select">
              Project <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Combobox
                items={projects}
                value={selectedProject}
                inputValue={selectedProject ? `${selectedProject.key} — ${selectedProject.name}` : projectSearch}
                onInputValueChange={handleProjectInputChange}
                onValueChange={handleProjectSelect}
                itemToStringLabel={(project: JiraProject) => `${project.key} — ${project.name}`}
              >
                <ComboboxInput
                  id="project-select"
                  placeholder={isLoadingProjects ? 'Loading projects...' : 'Search project...'}
                  className="w-full"
                  disabled={isLoadingProjects}
                  showClear
                />
                <ComboboxContent>
                  <ComboboxList>
                    {(project: JiraProject) => (
                      <ComboboxItem key={project.id} value={project}>
                        <span className="font-medium shrink-0">{project.key}</span>
                        <span className="text-muted-foreground truncate">— {project.name}</span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                  <ComboboxEmpty>No projects found</ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Date Range</Label>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <DateRangePicker
                id="warning-date-range"
                from={warningFromDate}
                to={warningToDate}
                onRangeChange={(from, to) => {
                  onWarningFromDateChange(from);
                  onWarningToDateChange(to);
                }}
                className="flex-1 w-full"
              />
              <ActionButton
                onClick={handleSearchClick}
                disabled={
                  !selectedProjectId || !warningFromDate || !warningToDate
                }
                className="w-full sm:w-auto"
                leftIcon={<Search />}
                isLoading={isSearchingWarnings}
                loadingText="Searching..."
              >
                Find Dates
              </ActionButton>
            </div>
          </div>
        </div>

        {/* Step 2 — Date Selection */}
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                2
              </span>
              Select dates
              {parsedDates.length > 0 && (
                <Token color="green" density="compact" className="ml-1">
                  {parsedDates.length} date
                  {parsedDates.length !== 1 ? 's' : ''}
                </Token>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Clear all */}
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className={`h-7 text-xs text-destructive hover:bg-destructive hover:text-white dark:hover:bg-destructive dark:hover:text-white ${parsedDates.length > 0 ? 'visible' : 'invisible'}`}
                leftIcon={<Trash2 />}
              >
                Clear all
              </ActionButton>

              {/* Add dates manually — Popover trigger */}
              <Popover>
                <PopoverTrigger asChild>
                  <ActionButton
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    leftIcon={<CalendarPlus />}
                  >
                    Add manually
                  </ActionButton>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="end"
                  sideOffset={8}
                >
                  <div className="p-3 border-b">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <Checkbox
                        checked={includeWeekends}
                        onCheckedChange={checked =>
                          onIncludeWeekendsChange(checked === true)
                        }
                      />
                      Include weekends
                    </label>
                  </div>
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={handleCalendarSelect}
                    disabled={includeWeekends ? undefined : isWeekend}
                    numberOfMonths={3}
                    showOutsideDays={false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Chip list — bordered box only when dates exist */}
          {selectedDates.length > 0 ? (
            <GlowPulseBox>
              <DateChipList
                dates={selectedDates}
                manualDateKeys={manualDateKeys}
                onRemove={handleRemoveDate}
              />
            </GlowPulseBox>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              No dates selected. Use &quot;Find Dates&quot; or add manually
              below.
            </span>
          )}
          {dateError && (
            <p className="text-sm text-destructive" role="alert">
              {dateError}
            </p>
          )}
        </div>
    </div>
  );
}
