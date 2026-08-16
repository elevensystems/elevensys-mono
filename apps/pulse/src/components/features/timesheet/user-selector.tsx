'use client';

import * as React from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@workspace/ui/components/combobox';

import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { MIN_USER_QUERY_LENGTH, useUserSearch } from '@/hooks/use-user-search';
import type { JiraUser } from '@/types/timesheet';

interface UserSelectorProps {
  id?: string;
  /** Selected Jira username; empty means "every user". */
  value: string;
  onChange: (username: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Type-ahead picker for a Jira user, backed by the user picker endpoint.
 *
 * The selection is the plain username, because that is what every worklog and
 * absence filter sends upstream. Display names are only a search aid: they are
 * shown in the list next to the username the row would select, so someone who
 * knows a colleague by name can still find the account.
 */
export function UserSelector({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = 'All users',
  className,
}: UserSelectorProps) {
  const { settings, isConfigured } = useTimesheetSettings();

  // Write-only: the input itself stays uncontrolled (see below), so this exists
  // purely to drive the lookup.
  const [searchQuery, setSearchQuery] = React.useState('');

  const { users, isLoading } = useUserSearch({
    query: searchQuery,
    token: settings.token,
    jiraInstance: settings.jiraInstance,
    // Picking a user writes their username into the input, which would
    // otherwise search for the account already selected.
    enabled: isConfigured && !disabled && searchQuery !== value,
  });

  const handleValueChange = React.useCallback(
    (username: string | null) => onChange(username ?? ''),
    [onChange]
  );

  const emptyMessage = isLoading
    ? 'Searching…'
    : searchQuery.trim().length < MIN_USER_QUERY_LENGTH
      ? `Type at least ${MIN_USER_QUERY_LENGTH} characters to search`
      : 'No users found';

  return (
    // The matches come from the server, so Base UI's client-side filtering is
    // off — it would re-filter what Jira already chose. The input is left
    // uncontrolled for the same reason the project switcher does: Base UI seeds
    // it from `value` and restores the selection on close, which a controlled
    // input would fight.
    <Combobox
      items={users}
      filter={null}
      value={value || null}
      onValueChange={handleValueChange}
      onInputValueChange={setSearchQuery}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        loading={isLoading}
        showClear
      />
      <ComboboxContent>
        <ComboboxList>
          {(user: JiraUser) => (
            <ComboboxItem key={user.name} value={user.name}>
              <span className="truncate font-medium">{user.displayName}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.name}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
}
