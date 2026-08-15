'use client';

import { useCallback, useSyncExternalStore } from 'react';

import {
  getServerProject,
  getStoredProject,
  subscribeToStoredProject,
  writeStoredProject,
} from '@/lib/selected-project';
import type { JiraProject } from '@/types/timesheet';

/** Search param carrying the project scope, e.g. `?project=PROJ`. */
export const PROJECT_SEARCH_PARAM = 'project';

/**
 * Reads and writes the app-wide project scope.
 *
 * Intentionally localStorage-only: keeping `useSearchParams` out of here means
 * the pages consuming it stay prerenderable without extra Suspense boundaries.
 * URL syncing lives in `ProjectSwitcher`, which is mounted inside one.
 */
export function useSelectedProject() {
  const selectedProject = useSyncExternalStore(
    subscribeToStoredProject,
    getStoredProject,
    getServerProject
  );

  const isLoaded = useSyncExternalStore(
    subscribeToStoredProject,
    () => true,
    () => false
  );

  const setSelectedProject = useCallback((project: JiraProject | null) => {
    writeStoredProject(project);
  }, []);

  return { selectedProject, setSelectedProject, isLoaded };
}
