'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Save,
  Server,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { ActionButton } from '@workspace/ui/components/action-button';
import MainLayout from '@/components/layouts/main-layout';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { NativeSelect } from '@workspace/ui/components/native-select';
import { Spinner } from '@workspace/ui/components/spinner';
import { DEFAULT_JIRA_INSTANCE } from '@/lib/constants';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';

export default function TimesheetConfigPage() {
  const { settings, saveSettings, isConfigured, isLoaded } =
    useTimesheetSettings();

  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [jiraInstance, setJiraInstance] = useState<string>(DEFAULT_JIRA_INSTANCE);
  const [showToken, setShowToken] = useState(false);

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    function syncFormFromSettings() {
      if (!isLoaded || initialized) return;
      setUsername(settings.username);
      setToken(settings.token);
      setJiraInstance(settings.jiraInstance || DEFAULT_JIRA_INSTANCE);
      setInitialized(true);
    }
    syncFormFromSettings();
  }, [isLoaded, initialized, settings]);

  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    initialized &&
    (username !== settings.username ||
      token !== settings.token ||
      jiraInstance !== settings.jiraInstance);

  const handleSave = useCallback(async () => {
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!token.trim()) {
      toast.error('Token is required');
      return;
    }

    setIsSaving(true);
    try {
      const params = new URLSearchParams({ jiraInstance });
      const response = await fetch(`/api/jira/auth/check?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      if (!response.ok) {
        toast.error('Token is not valid or not correct');
        return;
      }

      const result = await response.json();

      saveSettings({
        username: username.trim(),
        token: token.trim(),
        jiraInstance,
        authData: result.data,
      });
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Token is not valid or not correct');
    } finally {
      setIsSaving(false);
    }
  }, [username, token, jiraInstance, saveSettings]);

  const handleClear = useCallback(() => {
    setUsername('');
    setToken('');
    setJiraInstance(DEFAULT_JIRA_INSTANCE);
    saveSettings({ username: '', token: '', jiraInstance: DEFAULT_JIRA_INSTANCE });
    toast.success('Settings cleared');
  }, [saveSettings]);

  if (!isLoaded) {
    return (
      <MainLayout>
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-40">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Configurations</h1>
            {isConfigured ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                Not configured
              </span>
            )}
          </div>

          {/* Form rows */}
          <div className="border rounded-lg overflow-hidden divide-y">

            {/* Instance row */}
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="flex items-center gap-2.5 w-36 shrink-0 pt-2 text-muted-foreground">
                <Server className="h-4 w-4 shrink-0" />
                <label htmlFor="jira-instance" className="text-sm font-medium cursor-pointer">
                  Instance
                </label>
              </div>
              <div className="flex-1 space-y-1.5">
                <NativeSelect
                  id="jira-instance"
                  value={jiraInstance}
                  onChange={e => setJiraInstance(e.target.value)}
                >
                  <option value="jiradc">jiradc</option>
                  <option value="jira3">jira3</option>
                  <option value="jira9">jira9</option>
                </NativeSelect>
                <p className="text-xs text-muted-foreground">
                  Click{' '}
                  <a
                    href={`https://insight.fsoft.com.vn/${jiraInstance}/secure/ViewProfile.jspa`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    here
                  </a>
                  , → Then Click on{' '}
                  <span className="font-medium">Personal Access Tokens</span> →{' '}
                  <span className="font-medium">Create Token</span>
                </p>
              </div>
            </div>

            {/* Username row */}
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="flex items-center gap-2.5 w-36 shrink-0 pt-2 text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <label htmlFor="username" className="text-sm font-medium cursor-pointer">
                  Username
                </label>
              </div>
              <div className="flex-1 space-y-1.5">
                <Input
                  id="username"
                  placeholder="e.g. ThaoLNP5"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Your Jira account username</p>
              </div>
            </div>

            {/* Token row */}
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="flex items-center gap-2.5 w-36 shrink-0 pt-2 text-muted-foreground">
                <KeyRound className="h-4 w-4 shrink-0" />
                <label htmlFor="token" className="text-sm font-medium cursor-pointer">
                  Token
                </label>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="relative">
                  <Input
                    id="token"
                    type={showToken ? 'text' : 'password'}
                    placeholder="Your personal access token"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="pr-10"
                  />
                  <ActionButton
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowToken(prev => !prev)}
                    aria-label={showToken ? 'Hide token' : 'Show token'}
                    leftIcon={
                      showToken ? (
                        <EyeOff className="text-muted-foreground" />
                      ) : (
                        <Eye className="text-muted-foreground" />
                      )
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">Personal access token for API authentication</p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              {isConfigured && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/timesheet/logwork">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Log Work
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/timesheet/my-worklogs">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      My Worklogs
                    </Link>
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ActionButton
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleClear}
                disabled={!isConfigured}
                leftIcon={<Trash2 />}
              >
                Clear
              </ActionButton>
              <ActionButton
                size="sm"
                onClick={handleSave}
                disabled={isSaving || (!hasChanges && isConfigured)}
                leftIcon={isConfigured && !hasChanges ? <Check /> : <Save />}
                isLoading={isSaving}
                loadingText="Verifying..."
              >
                {isConfigured && !hasChanges ? 'Saved' : 'Save'}
              </ActionButton>
            </div>
          </div>

          {/* Privacy note */}
          <p className="flex items-center justify-center gap-1.5 mt-5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Credentials stored locally — passed directly to the Jira API.
          </p>

        </div>
      </section>
    </MainLayout>
  );
}
