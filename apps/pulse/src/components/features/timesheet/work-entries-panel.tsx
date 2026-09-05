'use client';

import { useMemo } from 'react';

import { Button } from '@workspace/ui/components/button';
import { Panel, PanelBody, PanelHeader } from '@workspace/ui/components/panel';
import { Token } from '@workspace/ui/components/token';
import { Plus } from 'lucide-react';

import { STANDARD_HOURS, formatHours } from '@/lib/timesheet';
import type { JiraIssue, RowErrors, WorkEntry } from '@/types/timesheet';

import { WorkEntryRow } from './work-entry-row';

interface WorkEntriesPanelProps {
  entries: WorkEntry[];
  issues: JiraIssue[];
  issuesByKey: Map<string, JiraIssue>;
  isLoadingIssues: boolean;
  onUpdate: (
    id: string,
    field: keyof WorkEntry,
    value: string | number
  ) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  /** Disables the Add Row button. */
  addDisabled?: boolean;
  /** Disables the inputs within each entry row. */
  rowsDisabled?: boolean;
  /** Per-row validation errors, keyed by entry id. */
  rowErrors?: Map<string, RowErrors>;
  onClearRowError?: (id: string, field: keyof RowErrors) => void;
  /** Extra classes for the Panel (e.g. an error ring). */
  className?: string;
}

/**
 * The daily-target header + editable ticket grid shared by the Log Work page
 * and the Autolog config form. Computes the total-hours token from `entries`;
 * callers own the entry state and validation.
 */
export function WorkEntriesPanel({
  entries,
  issues,
  issuesByKey,
  isLoadingIssues,
  onUpdate,
  onRemove,
  onAdd,
  addDisabled = false,
  rowsDisabled = false,
  rowErrors,
  onClearRowError,
  className,
}: WorkEntriesPanelProps) {
  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + (e.hours || 0), 0),
    [entries]
  );

  const hoursTokenColor =
    totalHours === STANDARD_HOURS
      ? 'green'
      : totalHours > STANDARD_HOURS
        ? 'orange'
        : 'gray';

  return (
    <Panel className={className}>
      <PanelHeader className="justify-between">
        {/* Daily target */}
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold">Daily target</span>
          <Token
            color={hoursTokenColor}
            density="compact"
            className="tabular-nums"
          >
            {formatHours(totalHours)}h / {formatHours(STANDARD_HOURS)}h
          </Token>
        </div>

        <Button variant="outline" onClick={onAdd} disabled={addDisabled}>
          <Plus />
          Add Row
        </Button>
      </PanelHeader>

      {/* Entries table */}
      <PanelBody>
        {/* Grid header */}
        <div className="grid grid-cols-[40px_230px_1fr_150px_140px_50px] gap-2 px-3 py-2 text-sm font-semibold text-muted-foreground">
          <span>#</span>
          <span>Key</span>
          <span>Description</span>
          <span>Type of Work</span>
          <span>Hours</span>
          <span />
        </div>
        {/* Entry rows */}
        {entries.map((entry, index) => (
          <WorkEntryRow
            key={entry.id}
            index={index}
            entry={entry}
            issues={issues}
            issuesByKey={issuesByKey}
            isLoadingIssues={isLoadingIssues}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onClearError={onClearRowError}
            errors={rowErrors?.get(entry.id)}
            disabled={rowsDisabled}
            isLastRow={entries.length === 1}
          />
        ))}
      </PanelBody>
    </Panel>
  );
}
