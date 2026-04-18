'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { JiraIssue, WorkType } from '@/types/timesheet';
import { WORK_TYPES } from '@/types/timesheet';

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

    fetch('/api/timesheet/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jiraInstance,
        jql: `project = ${projectId} ORDER BY created DESC`,
        columnConfig: 'explicit',
        layoutKey: 'split-view',
        startIndex: '0',
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

  const fetchIssueTypeOfWork = useCallback(
    async (issueId: number): Promise<WorkType | null> => {
      const cached = issues.find(i => i.id === issueId);
      if (cached?.typeOfWork) {
        return (WORK_TYPES as readonly string[]).includes(cached.typeOfWork)
          ? (cached.typeOfWork as WorkType)
          : null;
      }

      try {
        const response = await fetch(`/api/timesheet/issue/${issueId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ jiraInstance }),
        });

        if (!response.ok) return null;

        const result = await response.json();
        const typeOfWork = result?.data?.fields?.customfield_10400 as
          | string
          | null;

        if (
          typeOfWork &&
          (WORK_TYPES as readonly string[]).includes(typeOfWork)
        ) {
          setFetchedIssues(prev =>
            prev.map(i => (i.id === issueId ? { ...i, typeOfWork } : i))
          );
          return typeOfWork as WorkType;
        }

        return null;
      } catch {
        return null;
      }
    },
    [issues, token, jiraInstance]
  );

  const issuesByKey = useMemo(
    () => new Map(issues.map(i => [i.key, i])),
    [issues]
  );

  return {
    issues,
    issuesByKey,
    isLoadingIssues,
    fetchIssueTypeOfWork,
  };
}
