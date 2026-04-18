'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import type { JiraProject, TimesheetSettings } from '@/types/timesheet';

interface UseProjectsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

export function useProjects({ settings, isConfigured }: UseProjectsParams) {
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProjectState] =
    useState<JiraProject | null>(null);

  useEffect(() => {
    if (!isConfigured) return;

    const controller = new AbortController();
    let alive = true;

    (async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/timesheet/projects?jiraInstance=${settings.jiraInstance}`,
          {
            headers: { Authorization: `Bearer ${settings.token}` },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          if (alive) toast.error('Failed to fetch projects');
          return;
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          if (alive) setProjects(data.data as JiraProject[]);
        } else {
          if (alive) toast.error(data.error || 'Failed to fetch projects');
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError' && alive) {
          toast.error('Failed to fetch projects');
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [isConfigured, settings.jiraInstance, settings.token]);

  const setSelectedProject = useCallback((project: JiraProject | null) => {
    setSelectedProjectState(project);
  }, []);

  return {
    projects,
    isLoading,
    selectedProject,
    setSelectedProject,
  };
}
