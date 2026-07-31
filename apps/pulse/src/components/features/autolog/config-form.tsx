'use client';

import { useCallback, useMemo, useState } from 'react';

import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { NativeSelect } from '@workspace/ui/components/native-select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { WorkEntryRow } from '@/components/features/timesheet/work-entry-row';
import { useProjectIssues } from '@/hooks/use-project-issues';
import { generateEntryId } from '@/lib/timesheet';
import type {
  AutologConfig,
  CreateAutologConfigPayload,
} from '@/types/autolog';
import { DAY_NAMES, HOUR_OPTIONS } from '@/types/autolog';
import type {
  JiraProject,
  TimesheetSettings,
  WorkEntry,
} from '@/types/timesheet';

interface ConfigFormProps {
  settings: TimesheetSettings;
  projects: JiraProject[];
  isLoadingProjects: boolean;
  editing?: AutologConfig;
  onSave: (payload: CreateAutologConfigPayload) => Promise<boolean>;
  onCancel: () => void;
}

function toWorkEntries(config?: AutologConfig): WorkEntry[] {
  if (!config?.tickets.length) {
    return [
      {
        id: generateEntryId(),
        issueKey: '',
        typeOfWork: 'Create',
        description: '',
        hours: 1,
      },
    ];
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

  // Tickets as WorkEntry[]
  const [entries, setEntries] = useState<WorkEntry[]>(() =>
    toWorkEntries(editing)
  );

  // Schedule
  const [scheduleType, setScheduleType] = useState<'weekly' | 'monthly'>(
    editing?.schedule.type ?? 'weekly'
  );
  const [dayOfWeek, setDayOfWeek] = useState(editing?.schedule.dayOfWeek ?? 5);
  const [dayOfMonth, setDayOfMonth] = useState(
    editing?.schedule.dayOfMonth ?? 1
  );
  const [hour, setHour] = useState(editing?.schedule.hour ?? 9);

  // Email
  const [email, setEmail] = useState(
    editing?.email ?? `${settings.username}@fpt.com`
  );

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
    setEntries(prev => [
      ...prev,
      {
        id: generateEntryId(),
        issueKey: '',
        typeOfWork: 'Create',
        description: '',
        hours: 1,
      },
    ]);
  }, []);

  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + (e.hours || 0), 0),
    [entries]
  );

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

    const schedule =
      scheduleType === 'weekly'
        ? { type: 'weekly' as const, dayOfWeek, hour }
        : { type: 'monthly' as const, dayOfMonth, hour };

    const tickets = validEntries.map(e => ({
      issueKey: e.issueKey,
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

  return (
    <div className="space-y-8">
      {/* Project */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Project</Label>
        <NativeSelect
          value={selectedProject?.id ?? ''}
          onChange={e => {
            const p = projects.find(x => x.id === e.target.value);
            setSelectedProject(p ?? null);
          }}
          disabled={isLoadingProjects || !!editing}
        >
          <option value="">
            {isLoadingProjects
              ? 'Loading projects...'
              : '-- Choose a project --'}
          </option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              [{p.key}] {p.name}
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

      {/* Tickets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Tickets
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {totalHours}h total
            </span>
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Add tickets to log work for. Hours are logged per missing date.
        </p>
        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-[40px_230px_1fr_150px_140px_50px] gap-2 bg-muted/50 px-3 py-2 text-sm font-semibold text-muted-foreground">
            <div>#</div>
            <div>Key</div>
            <div>Description</div>
            <div>Type of Work</div>
            <div>Hours</div>
            <div />
          </div>
          <div>
            {entries.map((entry, index) => (
              <WorkEntryRow
                key={entry.id}
                index={index}
                entry={entry}
                issues={issues}
                issuesByKey={issuesByKey}
                isLoadingIssues={isLoadingIssues}
                onUpdate={updateEntry}
                onRemove={removeEntry}
                disabled={!selectedProject}
                isLastRow={entries.length === 1}
              />
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addEntry}
          disabled={!selectedProject}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Ticket
        </Button>
      </div>

      {/* Schedule */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Schedule</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Frequency</Label>
            <NativeSelect
              value={scheduleType}
              onChange={e =>
                setScheduleType(e.target.value as 'weekly' | 'monthly')
              }
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </NativeSelect>
          </div>

          {scheduleType === 'weekly' ? (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Day of week
              </Label>
              <NativeSelect
                value={String(dayOfWeek)}
                onChange={e => setDayOfWeek(Number(e.target.value))}
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Day of month
              </Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={e => setDayOfMonth(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Max 28</p>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Time (UTC)</Label>
            <NativeSelect
              value={String(hour)}
              onChange={e => setHour(Number(e.target.value))}
            >
              {HOUR_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Notification Email</Label>
        <p className="text-xs text-muted-foreground">
          Confirmation emails will be sent here after each autolog run.
        </p>
        <Input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your.name@fpt.com"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
        </Button>
      </div>
    </div>
  );
}
