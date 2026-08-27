'use client';

import * as React from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@workspace/ui/components/combobox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { Info } from 'lucide-react';

import { useProjects } from '@/hooks/use-projects';
import {
  PROJECT_SEARCH_PARAM,
  useSelectedProject,
} from '@/hooks/use-selected-project';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import type { JiraProject } from '@/types/timesheet';

const projectLabel = (project: JiraProject) => project.name;

/**
 * The stored project is re-parsed from localStorage, so it is never reference
 * equal to its entry in the fetched list — Base UI's default `Object.is`
 * comparison would leave the restored project unmarked in the dropdown.
 */
const isSameProject = (a: JiraProject, b: JiraProject) => a.key === b.key;

/**
 * Routes scoped by the app-wide project. Everything else — My Worklogs (which
 * filters by username only) and the autolog forms (which own the project as a
 * saved form value) — hides the switcher, since a visible-but-inert global
 * control is worse than no control at all.
 */
const PROJECT_SCOPED_ROUTES = [
  '/timesheet/logwork',
  '/timesheet/project-worklogs',
  '/timesheet/missing-worklogs',
  '/absences',
  '/worklog-management',
];

/** How long the unprompted tip stays up before it gets out of the way. */
const TIP_AUTO_HIDE_MS = 10_000;

export function isProjectScopedRoute(pathname: string) {
  return PROJECT_SCOPED_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * App-wide project scope, mounted in the header chrome.
 *
 * The project is a scope rather than a per-page filter — it means the same
 * thing on every page a user can navigate to — so it lives here instead of
 * being repeated in each page's filter row. Date ranges, usernames and
 * statuses stay page-local.
 *
 * This is also the only place that touches the URL: `?project=KEY` is what
 * makes a scoped view shareable, while localStorage remembers the last choice
 * for a cold open. The param is read as an input exactly once per mount and is
 * written from the selection thereafter — see the deep-link effect below.
 */
export function ProjectSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { settings, isConfigured } = useTimesheetSettings();
  const { projects, isLoading, selectedProject, setSelectedProject } =
    useProjects({ settings, isConfigured, globalSelection: true });

  /**
   * Read only for `isLoaded`. It comes from the same store as
   * `selectedProject`, so once it is true the selection above is the remembered
   * one rather than the null server snapshot — which is what keeps the tip
   * below from flashing at users who already have a project.
   */
  const { isLoaded } = useSelectedProject();

  const urlKey = searchParams.get(PROJECT_SEARCH_PARAM);

  const writeUrl = React.useCallback(
    (key: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key) {
        params.set(PROJECT_SEARCH_PARAM, key);
      } else {
        params.delete(PROJECT_SEARCH_PARAM);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const deepLinkResolvedRef = React.useRef(false);

  /**
   * Deep link: the URL wins, resolved as soon as the project list arrives —
   * but only once. Selecting writes localStorage synchronously while
   * `router.replace` lands a tick later, so a second read would see the stale
   * param and restore the project the user just cleared or replaced.
   *
   * Resolution is deferred until the list loads, otherwise a cold open on a
   * shared link would burn the one read against an empty list.
   */
  React.useEffect(() => {
    if (deepLinkResolvedRef.current) return;

    if (!urlKey) {
      deepLinkResolvedRef.current = true;
      return;
    }

    if (projects.length === 0) return;
    deepLinkResolvedRef.current = true;

    const match = projects.find(project => project.key === urlKey);
    if (match && match.key !== selectedProject?.key) setSelectedProject(match);
  }, [urlKey, projects, selectedProject, setSelectedProject]);

  // Remembered project but a bare URL: canonicalize so the link is shareable.
  React.useEffect(() => {
    if (urlKey || !selectedProject) return;
    writeUrl(selectedProject.key);
  }, [urlKey, selectedProject, writeUrl]);

  /** Set once the tip has had its turn — by timing out, or by the user. */
  const [isTipSpent, setIsTipSpent] = React.useState(false);
  /** A tip the user opened themselves: no timer, it follows the pointer. */
  const [isTipOpenedByUser, setIsTipOpenedByUser] = React.useState(false);

  /**
   * The unprompted tip waits for a real answer to "is a project selected?":
   * before the store loads, and while the list is still arriving, the selection
   * is empty for everyone.
   */
  const isTipOffered =
    isLoaded && isConfigured && !isLoading && !selectedProject && !isTipSpent;

  React.useEffect(() => {
    if (!isTipOffered) return;

    const timer = window.setTimeout(
      () => setIsTipSpent(true),
      TIP_AUTO_HIDE_MS
    );
    return () => window.clearTimeout(timer);
  }, [isTipOffered]);

  // Radix drives this from hover, focus and click on the trigger. Closing that
  // way also spends the unprompted tip: the user has seen it and moved on.
  const handleTipOpenChange = React.useCallback((open: boolean) => {
    setIsTipOpenedByUser(open);
    if (!open) setIsTipSpent(true);
  }, []);

  const handleSelect = React.useCallback(
    (value: JiraProject | null) => {
      setSelectedProject(value);
      writeUrl(value?.key ?? null);
      setIsTipSpent(true);
    },
    [setSelectedProject, writeUrl]
  );

  return (
    <div className="flex items-center gap-2">
      <Tooltip
        open={isTipOffered || isTipOpenedByUser}
        onOpenChange={handleTipOpenChange}
      >
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="About the project selector"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-xs">
          <p className="font-medium">Tips</p>
          <p>
            Now you only need to select{' '}
            <span className="font-medium">the project once here</span>. No need
            to switch on each page.
          </p>
        </TooltipContent>
      </Tooltip>
      <label
        htmlFor="global-project-select"
        className="text-muted-foreground hidden text-sm sm:block"
      >
        Project
      </label>
      {/* The input is intentionally uncontrolled: Base UI seeds it from
          `value`, filters `items` by what is typed, and restores the selected
          label on close. Controlling it pins the text to the selection and
          makes the field unsearchable. */}
      <Combobox
        items={projects}
        value={selectedProject}
        onValueChange={handleSelect}
        itemToStringLabel={projectLabel}
        isItemEqualToValue={isSameProject}
      >
        <ComboboxInput
          id="global-project-select"
          placeholder={isLoading ? 'Loading projects...' : 'Select project...'}
          className="w-[220px] lg:w-[280px]"
          disabled={!isConfigured || isLoading}
          loading={isLoading}
          showClear
        />
        <ComboboxContent>
          <ComboboxList>
            {(project: JiraProject) => (
              <ComboboxItem key={project.id} value={project}>
                <span className="font-medium shrink-0">{project.name}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty>No projects found</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
