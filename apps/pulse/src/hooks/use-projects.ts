'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { isAuthError } from '@/lib/fetch-utils';
import type { JiraProject, TimesheetSettings } from '@/types/timesheet';

import { useSelectedProject } from './use-selected-project';

interface UseProjectsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
  /**
   * Opt in to the app-wide project scope (the header switcher). Report pages
   * and Log Work set this; the autolog form keeps its own local selection,
   * because there the project is a saved form value that a background switch
   * must never retarget.
   */
  globalSelection?: boolean;
}

/**
 * Project list, cached per credential set for the lifetime of the page session.
 * Without this the list refetched on every client-side navigation, since each
 * route remounts the hook.
 */
const projectsCache = new Map<string, JiraProject[]>();

/**
 * De-dupes concurrent first loads. Two hook instances mounting in the same tick
 * — React StrictMode's double-mount, or a page and the header switcher together
 * — would otherwise both fire before either populated the cache.
 */
const inflightRequests = new Map<string, Promise<JiraProject[]>>();

class ProjectsFetchError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'ProjectsFetchError';
  }
}

function fetchProjects(
  cacheKey: string,
  jiraInstance: string,
  token: string
): Promise<JiraProject[]> {
  const existing = inflightRequests.get(cacheKey);
  if (existing) return existing;

  const request = (async () => {
    const response = await fetch(
      `/api/jira/projects?jiraInstance=${jiraInstance}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new ProjectsFetchError(
        'Failed to fetch projects',
        response.status
      );
    }

    const data = await response.json();
    if (!data.success || !Array.isArray(data.data)) {
      throw new ProjectsFetchError(data.error || 'Failed to fetch projects');
    }

    const list = data.data as JiraProject[];
    projectsCache.set(cacheKey, list);
    return list;
  })();

  inflightRequests.set(cacheKey, request);
  void request.catch(() => {}).finally(() => inflightRequests.delete(cacheKey));

  return request;
}

export function useProjects({
  settings,
  isConfigured,
  globalSelection = false,
}: UseProjectsParams) {
  const cacheKey = `${settings.jiraInstance}::${settings.token}`;
  const cachedProjects = projectsCache.get(cacheKey);

  const [fetchedProjects, setFetchedProjects] = useState<JiraProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(false);

  const projects = cachedProjects ?? fetchedProjects;

  const [localProject, setLocalProject] = useState<JiraProject | null>(null);
  const {
    selectedProject: globalProject,
    setSelectedProject: setGlobalProject,
  } = useSelectedProject();

  useEffect(() => {
    if (!isConfigured || projectsCache.has(cacheKey)) return;

    let alive = true;

    (async () => {
      setIsLoading(true);
      try {
        const list = await fetchProjects(
          cacheKey,
          settings.jiraInstance,
          settings.token
        );
        if (!alive) return;
        setAuthError(false);
        setFetchedProjects(list);
      } catch (err: unknown) {
        if (!alive) return;
        const status =
          err instanceof ProjectsFetchError ? err.status : undefined;

        if (status !== undefined && isAuthError(status)) {
          setAuthError(true);
        } else {
          setAuthError(false);
          toast.error(
            err instanceof Error ? err.message : 'Failed to fetch projects'
          );
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isConfigured, cacheKey, settings.jiraInstance, settings.token]);

  const setSelectedProject = useCallback(
    (project: JiraProject | null) => {
      if (globalSelection) {
        setGlobalProject(project);
      } else {
        setLocalProject(project);
      }
    },
    [globalSelection, setGlobalProject]
  );

  return {
    projects,
    isLoading,
    authError,
    selectedProject: globalSelection ? globalProject : localProject,
    setSelectedProject,
  };
}
