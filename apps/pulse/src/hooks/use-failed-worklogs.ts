'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  failedWorklogsStorageKey,
  loadFailedWorklogs,
  saveFailedWorklogs,
} from '@/lib/timesheet';
import type { FailedWorklog } from '@/types/timesheet';

function load(projectId: string | undefined): FailedWorklog[] {
  return projectId ? loadFailedWorklogs(projectId) : [];
}

/**
 * The project's worklogs that were not confirmed as logged, kept across
 * reloads so they can be retried for exactly the dates that are missing.
 *
 * Every update re-reads storage and writes straight back, so another tab's
 * changes are never overwritten and an update still lands if the page has
 * unmounted by the time a run finishes. An update always lands in the project
 * it was bound to, and only reaches the list on screen if that project is
 * still the one shown — a run that ends after the user switched project must
 * not show its leftovers under the new one.
 */
export function useFailedWorklogs(projectId: string | undefined) {
  const [listProjectId, setListProjectId] = useState(projectId);
  const [failedWorklogs, setFailedWorklogs] = useState(() => load(projectId));

  if (listProjectId !== projectId) {
    setListProjectId(projectId);
    setFailedWorklogs(load(projectId));
  }

  const shownProjectIdRef = useRef(projectId);
  useEffect(() => {
    shownProjectIdRef.current = projectId;
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const key = failedWorklogsStorageKey(projectId);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setFailedWorklogs(loadFailedWorklogs(projectId));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [projectId]);

  const updateFailedWorklogs = useCallback(
    (update: (current: FailedWorklog[]) => FailedWorklog[]) => {
      if (!projectId) return;
      const next = update(loadFailedWorklogs(projectId));
      saveFailedWorklogs(next, projectId);
      if (shownProjectIdRef.current === projectId) setFailedWorklogs(next);
    },
    [projectId]
  );

  return { failedWorklogs, updateFailedWorklogs };
}
