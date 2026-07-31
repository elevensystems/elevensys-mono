'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { JiraIssue } from '@/types/timesheet';

interface UseProjectIssuesParams {
  projectId: string;
  token: string;
  jiraInstance: string;
  enabled: boolean;
}

export function useProjectIssues({
  projectId,
  token,
  jiraInstance,
  enabled,
}: UseProjectIssuesParams) {
  const [fetchedIssues, setFetchedIssues] = useState<JiraIssue[]>([]);
  const [activeFetchId, setActiveFetchId] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const shouldFetch = enabled && !!projectId;

  // Derive issues — empty when not fetching for a valid project
  const emptyIssues = useMemo<JiraIssue[]>(() => [], []);
  const issues = useMemo(
    () => (shouldFetch ? fetchedIssues : emptyIssues),
    [shouldFetch, fetchedIssues, emptyIssues]
  );
  const isLoadingIssues = activeFetchId !== null;

  useEffect(() => {
    if (!shouldFetch) return;

    const controller = new AbortController();
    const id = String(++fetchIdRef.current);
    setActiveFetchId(id);

    fetch('/api/jira/issues/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jiraInstance,
        jql: `project = ${projectId} AND resolution = Unresolved ORDER BY priority DESC, updated DESC`,
      }),
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data?.issues)) {
          setFetchedIssues(result.data.issues);
        } else {
          setFetchedIssues([]);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setFetchedIssues([]);
        }
      })
      .finally(() => {
        setActiveFetchId(prev => (prev === id ? null : prev));
      });

    return () => controller.abort();
  }, [shouldFetch, projectId, jiraInstance, token]);

  const issuesByKey = useMemo(
    () => new Map(issues.map(i => [i.key, i])),
    [issues]
  );

  return {
    issues,
    issuesByKey,
    isLoadingIssues,
  };
}
