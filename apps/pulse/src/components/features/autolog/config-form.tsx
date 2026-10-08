'use client';

import { useCallback, useState } from 'react';

import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { NativeSelect } from '@workspace/ui/components/native-select';
import { Spinner } from '@workspace/ui/components/spinner';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Clock, MessageSquare, Plus, PlusCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

import { WorkEntriesPanel } from '@/components/features/timesheet/work-entries-panel';
import { useProjectIssues } from '@/hooks/use-project-issues';
import {
  createDefaultEntry,
  createWorklogProfile,
  generateEntryId,
  loadWorklogProfiles,
  nextProfileName,
  profileTicketEntries,
} from '@/lib/timesheet';
import type {
  AutologConfig,
  CreateAutologConfigPayload,
} from '@/types/autolog';
import {
  browserTimezone,
  formatNextRun,
  formatScheduleSlot,
  formatScheduleWeekday,
  notificationEmail,
} from '@/types/autolog';
import type {
  JiraProject,
  TimesheetSettings,
  WorkEntry,
  WorklogProfile,
} from '@/types/timesheet';

interface ConfigFormProps {
  settings: TimesheetSettings;
  projects: JiraProject[];
  isLoadingProjects: boolean;
  editing?: AutologConfig;
  onSave: (payload: CreateAutologConfigPayload) => Promise<boolean>;
  onCancel: () => void;
}

// Autolog is still in development — saving is disabled until the backend is ready.
const SAVE_ENABLED = true;

const SAVED_CONFIG_TAB = 'Saved config';

function toWorkEntries(config?: AutologConfig): WorkEntry[] {
  if (!config?.tickets.length) {
    return [createDefaultEntry()];
  }
  return config.tickets.map(t => ({
    id: generateEntryId(),
    issueKey: t.issueKey,
    typeOfWork: t.typeOfWork ?? 'Create',
    description: t.description ?? '',
    hours: t.hours,
  }));
}

export function ConfigForm({
  settings,
  projects,
  isLoadingProjects,
  editing,
  onSave,
  onCancel,
}: ConfigFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Project
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(
    editing
      ? {
          id: editing.projectId,
          key: editing.projectKey,
          name: editing.projectName,
        }
      : null
  );

  // The project's Log Work profiles plus any temporary ones added here. All of
  // it lives in memory only — nothing here writes back to localStorage. Editing
  // opens on a tab holding the config's saved tickets.
  const [profiles, setProfiles] = useState<WorklogProfile[]>(() =>
    editing
      ? [
          createWorklogProfile(SAVED_CONFIG_TAB, toWorkEntries(editing)),
          ...loadWorklogProfiles(editing.projectId).profiles,
        ]
      : []
  );
  const [profileId, setProfileId] = useState(() => profiles[0]?.id ?? '');

  // Tickets of the active tab, as WorkEntry[]
  const [entries, setEntries] = useState<WorkEntry[]>(
    () => profiles[0]?.entries ?? [createDefaultEntry()]
  );

  const showProfile = (profile: WorklogProfile) => {
    setProfileId(profile.id);
    setEntries(profileTicketEntries(profile));
  };

  // Keeps the active tab's edits for when the user switches back to it.
  const withCurrentEntries = (list: WorklogProfile[]) =>
    list.map(p => (p.id === profileId ? { ...p, entries } : p));

  const switchProfile = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;
    setProfiles(withCurrentEntries);
    showProfile(profile);
  };

  const createProfile = () => {
    const profile = createWorklogProfile(nextProfileName(profiles));
    setProfiles(prev => [...withCurrentEntries(prev), profile]);
    showProfile(profile);
  };

  // Schedule — frequency is the only thing the user picks. The backend derives
  // the run instant from it, their timezone, and a stable per-user offset.
  const [scheduleType, setScheduleType] = useState<'weekly' | 'monthly'>(
    editing?.schedule.type ?? 'weekly'
  );

  // Only meaningful while the frequency still matches what was saved; once the
  // user switches it, the old instant describes a schedule that no longer applies.
  const savedSlot =
    editing && editing.schedule.type === scheduleType ? editing.schedule : null;

  // Teams recipient — derived from the username, never hand-entered.
  const email = notificationEmail(settings.username);

  // Issues for WorkEntryRow
  const { issues, issuesByKey, isLoadingIssues } = useProjectIssues({
    projectId: selectedProject?.id ?? '',
    token: settings.token,
    jiraInstance: settings.jiraInstance,
    enabled: !!selectedProject,
  });

  const updateEntry = useCallback(
    (id: string, field: keyof WorkEntry, value: string | number) => {
      setEntries(prev =>
        prev.map(e => (e.id === id ? { ...e, [field]: value } : e))
      );
    },
    []
  );

  const removeEntry = useCallback((id: string) => {
    setEntries(prev =>
      prev.length > 1 ? prev.filter(e => e.id !== id) : prev
    );
  }, []);

  const addEntry = useCallback(() => {
    setEntries(prev => [...prev, createDefaultEntry()]);
  }, []);

  const handleSubmit = async () => {
    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }
    const validEntries = entries.filter(e => e.issueKey.trim());
    if (validEntries.length === 0) {
      toast.error('Please add at least one ticket');
      return;
    }
    if (validEntries.some(e => e.hours <= 0)) {
      toast.error('All tickets must have hours > 0');
      return;
    }

    const schedule = {
      type: scheduleType,
      timezone: browserTimezone(),
    };

    const tickets = validEntries.map(e => ({
      issueKey: e.issueKey.trim(),
      hours: e.hours,
      description: e.description || undefined,
      typeOfWork: e.typeOfWork,
    }));

    const payload: CreateAutologConfigPayload = {
      username: settings.username,
      email,
      jiraInstance: settings.jiraInstance,
      projectId: selectedProject.id,
      projectKey: selectedProject.key,
      projectName: selectedProject.name,
      tickets,
      schedule,
    };

    setIsSaving(true);
    const ok = await onSave(payload);
    setIsSaving(false);
    if (ok) onCancel();
  };

  const actions = (
    <div className="flex items-center gap-3">
      {!SAVE_ENABLED && (
        <p className="text-xs text-muted-foreground">
          Autolog is still in development.
        </p>
      )}
      <Button variant="outline" onClick={onCancel} disabled={isSaving}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={isSaving || !SAVE_ENABLED}>
        {isSaving ? (
          <>
            <Spinner />
            Saving...
          </>
        ) : editing ? (
          <>
            <Save />
            Save Changes
          </>
        ) : (
          <>
            <PlusCircle />
            Create
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="flex min-w-0 flex-col space-y-8">
      {/* Project + frequency */}
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-2">
          <Label className="text-sm font-medium">Project</Label>
          <NativeSelect
            value={selectedProject?.id ?? ''}
            onChange={e => {
              const p = projects.find(x => x.id === e.target.value);
              setSelectedProject(p ?? null);
              if (!p) {
                setProfiles([]);
                setProfileId('');
                setEntries([createDefaultEntry()]);
                return;
              }
              const store = loadWorklogProfiles(p.id);
              setProfiles(store.profiles);
              showProfile(
                store.profiles.find(x => x.id === store.activeId) ??
                  store.profiles[0]
              );
            }}
            disabled={isLoadingProjects || !!editing}
          >
            <option value="">
              {isLoadingProjects ? 'Loading projects...' : 'Choose a project'}
            </option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
          {editing && (
            <p className="text-xs text-muted-foreground">
              Project cannot be changed. Delete and recreate to use a different
              project.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Frequency</Label>
          <Tabs
            value={scheduleType}
            onValueChange={value =>
              setScheduleType(value as 'weekly' | 'monthly')
            }
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="weekly" className="px-4">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="px-4">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tickets */}
      <div className="min-w-0 space-y-3">
        <Label className="text-sm font-medium">Tickets</Label>
        <div className="min-w-0 overflow-x-auto">
          <WorkEntriesPanel
            entries={entries}
            issues={issues}
            issuesByKey={issuesByKey}
            isLoadingIssues={isLoadingIssues}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            onAdd={addEntry}
            addDisabled={!selectedProject}
            rowsDisabled={!selectedProject}
            tabs={
              // Always rendered, even empty before a project is chosen, so the
              // header keeps the same layout and nothing shifts on selection.
              <Tabs
                value={profileId}
                onValueChange={switchProfile}
                className="min-w-48 flex-1 gap-0 self-stretch"
              >
                <div className="flex h-full min-w-0 items-stretch gap-1 overflow-x-auto">
                  <TabsList
                    aria-label="Fill tickets from a worklog profile"
                    className="h-full items-stretch gap-1 rounded-none bg-transparent p-0"
                  >
                    {profiles.map(profile => (
                      <TabsTrigger
                        key={profile.id}
                        value={profile.id}
                        title="Fill tickets from this Log Work profile"
                        className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground relative h-full flex-none border-0 bg-transparent px-3 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent"
                      >
                        <span className="max-w-40 truncate">
                          {profile.name}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex shrink-0 items-center pl-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={createProfile}
                      disabled={!selectedProject}
                      aria-label="New temporary profile"
                      title="New temporary profile — not saved to Log Work"
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
              </Tabs>
            }
          />
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Schedule</Label>
        <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="space-y-0.5 text-xs text-muted-foreground">
            {savedSlot ? (
              <>
                <p className="text-foreground">
                  Runs{' '}
                  {scheduleType === 'weekly'
                    ? `every ${formatScheduleWeekday(savedSlot) ?? 'Friday'}`
                    : 'on the last working day of each month'}{' '}
                  at {formatScheduleSlot(savedSlot)}.
                </p>
                {formatNextRun(savedSlot) && (
                  <p>Next run: {formatNextRun(savedSlot)}.</p>
                )}
              </>
            ) : (
              <>
                <p className="text-foreground">
                  We pick the best time for you — the{' '}
                  {scheduleType === 'weekly'
                    ? 'end of each week'
                    : 'last working day of each month'}
                  , after work hours in your timezone
                  {browserTimezone() ? ` (${browserTimezone()})` : ''}.
                </p>
                <p>
                  Running late in the period gives you the most chance to log
                  manually first, and avoids the weekend, when Jira goes down
                  for maintenance.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Teams notifications */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Teams Notifications</Label>
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{email}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          After each autolog run, Flow bot sends you a summary in Microsoft
          Teams at this address.
        </p>
      </div>

      {/* Actions — sticky so Save stays reachable while scrolling a long
          ticket list in the modal. */}
      <div className="sticky bottom-0 z-10 mt-auto flex items-center justify-end border-t bg-background py-4">
        {actions}
      </div>
    </div>
  );
}
