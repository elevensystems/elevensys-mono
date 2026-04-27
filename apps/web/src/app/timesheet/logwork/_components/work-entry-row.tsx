'use client';

import { memo, useCallback, useState } from 'react';

import { Trash2 } from 'lucide-react';

import { ActionButton } from '@workspace/ui/components/action-button';
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
import { cn } from '@workspace/ui/lib/utils';
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
  onFetchTypeOfWork: (issueId: number) => Promise<WorkType | null>;
  onClearError?: (id: string, field: keyof RowErrors) => void;
  errors?: RowErrors;
  disabled?: boolean;
  isLastRow?: boolean;
}

export const WorkEntryRow = memo(function WorkEntryRow({
  entry,
  issues,
  issuesByKey,
  isLoadingIssues,
  onUpdate,
  onRemove,
  onFetchTypeOfWork,
  onClearError,
  errors,
  disabled = false,
  isLastRow = false,
}: WorkEntryRowProps) {
  const [isFetchingTypeOfWork, setIsFetchingTypeOfWork] = useState(false);

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

      // Use cached typeOfWork if available
      if (value.typeOfWork) {
        onUpdate(entry.id, 'typeOfWork', value.typeOfWork);
        return;
      }

      // Fetch in background — row stays fully interactive
      setIsFetchingTypeOfWork(true);
      onFetchTypeOfWork(value.id)
        .then(typeOfWork => {
          if (typeOfWork) {
            onUpdate(entry.id, 'typeOfWork', typeOfWork);
          }
        })
        .catch(() => {
          // Silent failure — field stays on current value
        })
        .finally(() => setIsFetchingTypeOfWork(false));
    },
    [entry.id, onUpdate, onClearError, onFetchTypeOfWork]
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
    <div className="grid grid-cols-[230px_1fr_150px_140px_50px] items-start gap-2 border-b px-3 py-2">
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
              'h-8',
              errors?.issueKey && 'border-destructive ring-1 ring-destructive'
            )}
            disabled={isLoadingIssues || disabled}
            aria-invalid={!!errors?.issueKey}
            showClear
          />
          <ComboboxContent>
            <ComboboxList>
              {(issue: JiraIssue) => (
                <ComboboxItem key={issue.id} value={issue}>
                  <span className="shrink-0">{issue.key}</span>
                </ComboboxItem>
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
            'h-8',
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
        {/* Subtle pulse border while background fetch is in flight */}
        <div
          className={cn(
            'rounded-md',
            isFetchingTypeOfWork && 'ring-2 ring-primary/30 animate-pulse'
          )}
        >
          <Select value={entry.typeOfWork} onValueChange={handleTypeChange}>
            <SelectTrigger size="sm" className="w-full">
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
      </div>
      <div>
        <HoursStepper
          value={entry.hours}
          onChange={handleHoursChange}
          disabled={disabled}
        />
      </div>
      <div className="flex justify-center">
        <ActionButton
          aria-label="Delete"
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:bg-destructive hover:text-white"
          onClick={handleRemove}
          disabled={isLastRow}
          leftIcon={<Trash2 />}
        />
      </div>
    </div>
  );
});
