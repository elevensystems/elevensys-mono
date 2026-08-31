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
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
} from '@workspace/ui/components/popover';
import { cn } from '@workspace/ui/lib/utils';

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

  /**
   * The tip and the project list occupy the same spot under the field, so the
   * list wins while it is open — the tip is a nudge toward that list, not
   * something to click through.
   */
  const [isListOpen, setIsListOpen] = React.useState(false);

  /**
   * There is no dismiss: the tip describes the one thing still missing, so it
   * stands until a project is picked and returns if the field is cleared.
   *
   * It waits for a real answer to "is a project selected?" first — before the
   * store loads, and while the list is still arriving, the selection is empty
   * for everyone.
   */
  const isTipOpen =
    isLoaded && isConfigured && !isLoading && !selectedProject && !isListOpen;

  const handleSelect = React.useCallback(
    (value: JiraProject | null) => {
      setSelectedProject(value);
      writeUrl(value?.key ?? null);
    },
    [setSelectedProject, writeUrl]
  );

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="global-project-select"
        className="text-muted-foreground hidden text-sm sm:block"
      >
        Project
      </label>
      {/* The coachmark hangs off the field itself rather than off an icon
          beside it: what it is pointing at is the control, and a hint the user
          has to hunt for is not a hint. */}
      <Popover open={isTipOpen}>
        <PopoverAnchor>
          {/* The input is intentionally uncontrolled: Base UI seeds it from
              `value`, filters `items` by what is typed, and restores the
              selected label on close. Controlling it pins the text to the
              selection and makes the field unsearchable. */}
          <Combobox
            items={projects}
            value={selectedProject}
            onValueChange={handleSelect}
            onOpenChange={setIsListOpen}
            itemToStringLabel={projectLabel}
            isItemEqualToValue={isSameProject}
          >
            <ComboboxInput
              id="global-project-select"
              placeholder={
                isLoading ? 'Loading projects...' : 'Select project...'
              }
              className={cn(
                'w-[220px] lg:w-[280px]',
                // Spotlight: while the tip is up, the field it describes is
                // lifted out of the header chrome.
                isTipOpen && 'ring-foreground/70 rounded-md ring-2'
              )}
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
        </PopoverAnchor>
        <PopoverContent
          side="bottom"
          align="start"
          alignOffset={-4}
          sideOffset={10}
          // The card appears unbidden and holds nothing to click, so it neither
          // takes the caret from whatever the user was doing nor stands between
          // the pointer and the field it is pointing at.
          onOpenAutoFocus={event => event.preventDefault()}
          className="bg-foreground text-background pointer-events-none w-80 rounded-xl border-0 p-4 shadow-lg"
        >
          <PopoverArrow className="fill-foreground" />
          <p className="text-[15px] leading-6 font-semibold">
            Pick your project once
          </p>
          <p className="text-background/70 mt-1.5 text-sm leading-6">
            Choose one here and every page follows along, no need to set it
            again.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
