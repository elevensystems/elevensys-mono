'use client';

import { memo, useCallback } from 'react';

import { Button } from '@workspace/ui/components/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@workspace/ui/components/combobox';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { Trash2 } from 'lucide-react';

import { getWorkTypeDotClass } from '@/lib/timesheet';
import {
  type JiraIssue,
  type RowErrors,
  WORK_TYPES,
  type WorkEntry,
  type WorkType,
} from '@/types/timesheet';

import { HoursStepper } from './hours-stepper';

interface WorkEntryRowProps {
  index: number;
  entry: WorkEntry;
  issues: JiraIssue[];
  issuesByKey: Map<string, JiraIssue>;
  isLoadingIssues: boolean;
  onUpdate: (
    id: string,
    field: keyof WorkEntry,
    value: string | number
  ) => void;
  onRemove: (id: string) => void;
  onClearError?: (id: string, field: keyof RowErrors) => void;
  errors?: RowErrors;
  disabled?: boolean;
  isLastRow?: boolean;
}

export const WorkEntryRow = memo(function WorkEntryRow({
  index,
  entry,
  issues,
  issuesByKey,
  isLoadingIssues,
  onUpdate,
  onRemove,
  onClearError,
  errors,
  disabled = false,
}: WorkEntryRowProps) {
  const handleIssueInputChange = useCallback(
    (value: string, eventDetails: { reason: string }) => {
      if (eventDetails.reason === 'input-clear') return;
      onUpdate(entry.id, 'issueKey', value);
      onClearError?.(entry.id, 'issueKey');
    },
    [entry.id, onUpdate, onClearError]
  );

  const handleIssueSelect = useCallback(
    (value: JiraIssue | null) => {
      onUpdate(entry.id, 'issueKey', value?.key ?? '');
      onUpdate(entry.id, 'description', value?.summary ?? '');
      onClearError?.(entry.id, 'issueKey');

      if (!value) return;

      // typeOfWork is always returned with the issue list now
      if (value.typeOfWork) {
        onUpdate(entry.id, 'typeOfWork', value.typeOfWork);
      }
    },
    [entry.id, onUpdate, onClearError]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(entry.id, 'description', e.target.value);
      onClearError?.(entry.id, 'description');
    },
    [entry.id, onUpdate, onClearError]
  );

  const handleTypeChange = useCallback(
    (value: string) => onUpdate(entry.id, 'typeOfWork', value as WorkType),
    [entry.id, onUpdate]
  );

  const handleHoursChange = useCallback(
    (value: number) => onUpdate(entry.id, 'hours', value),
    [entry.id, onUpdate]
  );

  const handleRemove = useCallback(
    () => onRemove(entry.id),
    [entry.id, onRemove]
  );

  const selectedIssue = issuesByKey.get(entry.issueKey) ?? null;

  return (
    <div className="grid grid-cols-[40px_230px_1fr_150px_140px_50px] items-start gap-2 border-t px-3 py-2">
      <div className="flex h-9 items-center text-sm text-muted-foreground">
        {index + 1}
      </div>
      <div>
        <Combobox
          items={issues}
          value={selectedIssue}
          inputValue={entry.issueKey}
          onInputValueChange={handleIssueInputChange}
          onValueChange={handleIssueSelect}
          itemToStringLabel={(issue: JiraIssue) => issue.key}
        >
          <ComboboxInput
            placeholder={isLoadingIssues ? 'Loading...' : 'Select ticket'}
            className={cn(
              'h-9',
              errors?.issueKey && 'border-destructive ring-1 ring-destructive'
            )}
            disabled={isLoadingIssues || disabled}
            aria-invalid={!!errors?.issueKey}
            loading={isLoadingIssues}
            showClear
          />
          <ComboboxContent>
            <ComboboxList>
              {(issue: JiraIssue) => (
                <Tooltip key={issue.id}>
                  <TooltipTrigger asChild>
                    <ComboboxItem value={issue}>
                      <span className="shrink-0">{issue.key}</span>
                      {issue.typeOfWork && (
                        <span
                          className={cn(
                            'ml-auto size-2 shrink-0 rounded-full',
                            getWorkTypeDotClass(issue.typeOfWork)
                          )}
                        />
                      )}
                    </ComboboxItem>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="max-w-xs"
                  >
                    <p className="font-medium">{issue.summary}</p>
                    {issue.typeOfWork && (
                      <p className="mt-1 flex items-center gap-1.5">
                        <span
                          className={cn(
                            'size-2 shrink-0 rounded-full',
                            getWorkTypeDotClass(issue.typeOfWork)
                          )}
                        />
                        {issue.typeOfWork}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )}
            </ComboboxList>
            <ComboboxEmpty>No issues found</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
        {errors?.issueKey && (
          <span className="mt-1 text-xs text-destructive" role="alert">
            {errors.issueKey}
          </span>
        )}
      </div>
      <div>
        <Input
          placeholder="Description of work done"
          value={entry.description}
          onChange={handleDescriptionChange}
          maxLength={500}
          className={cn(
            'h-9',
            errors?.description && 'border-destructive ring-1 ring-destructive'
          )}
          aria-invalid={!!errors?.description}
        />
        {errors?.description && (
          <span className="mt-1 text-xs text-destructive" role="alert">
            {errors.description}
          </span>
        )}
      </div>
      <div>
        <Select value={entry.typeOfWork} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    getWorkTypeDotClass(entry.typeOfWork)
                  )}
                />
                {entry.typeOfWork}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {WORK_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      getWorkTypeDotClass(type)
                    )}
                  />
                  {type}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <HoursStepper
          value={entry.hours}
          onChange={handleHoursChange}
          disabled={disabled}
        />
      </div>
      <div className="flex justify-center">
        <Button variant="ghost" size="icon" onClick={handleRemove}>
          <Trash2 />
        </Button>
      </div>
    </div>
  );
});
