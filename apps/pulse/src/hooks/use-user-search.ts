'use client';

import { useEffect, useState } from 'react';

import type { JiraUser } from '@/types/timesheet';

/** Jira's picker matches any prefix, so a single character returns noise. */
export const MIN_USER_QUERY_LENGTH = 2;

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 20;

const NO_USERS: JiraUser[] = [];

interface UseUserSearchParams {
  query: string;
  token: string;
  jiraInstance: string;
  enabled: boolean;
}

/** Results are stored with the query that produced them — see below. */
interface SearchResult {
  query: string;
  users: JiraUser[];
}

const INITIAL_RESULT: SearchResult = { query: '', users: NO_USERS };

/**
 * Type-ahead search against `/api/jira/users/picker`.
 *
 * Every keystroke would otherwise be a request, so the query is debounced and
 * the in-flight request is aborted whenever it changes — without the abort a
 * slow early response could land after a faster later one and overwrite it.
 *
 * The result carries the query it answers, which makes both "these matches are
 * stale" and "a request is outstanding" derivable rather than separate state to
 * keep in sync.
 */
export function useUserSearch({
  query,
  token,
  jiraInstance,
  enabled,
}: UseUserSearchParams) {
  const [result, setResult] = useState<SearchResult>(INITIAL_RESULT);

  const trimmedQuery = query.trim();
  const shouldSearch =
    enabled && !!token && trimmedQuery.length >= MIN_USER_QUERY_LENGTH;
  const isCurrent = result.query === trimmedQuery;

  useEffect(() => {
    if (!shouldSearch) return;

    const controller = new AbortController();

    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        query: trimmedQuery,
        jiraInstance,
        maxResults: String(MAX_RESULTS),
      });

      fetch(`/api/jira/users/picker?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
        .then(response => response.json())
        .then(data => {
          setResult({
            query: trimmedQuery,
            users: data.success && Array.isArray(data.data) ? data.data : [],
          });
        })
        .catch(error => {
          // An abort means a newer query is already running; anything else is a
          // failed lookup, recorded as "no matches" so the spinner stops.
          if (error.name !== 'AbortError') {
            setResult({ query: trimmedQuery, users: NO_USERS });
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [shouldSearch, trimmedQuery, token, jiraInstance]);

  return {
    users: shouldSearch && isCurrent ? result.users : NO_USERS,
    isLoading: shouldSearch && !isCurrent,
  };
}
