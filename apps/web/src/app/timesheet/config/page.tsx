'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Save,
  Settings as SettingsIcon,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { ActionButton } from '@workspace/ui/components/action-button';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
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

  // Sync local form state with loaded settings
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
      const response = await fetch(`/api/timesheet/auth?${params.toString()}`, {
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
        <div className="max-w-5xl mx-auto space-y-12">
          <ToolPageHeader
            title="Configurations"
            description="Configure your credentials to connect with Jira. These configs are stored locally in your browser."
            infoMessage="Your credentials are stored only in your browser's local storage and are never sent to our servers — they are passed directly to the Jira API."
          />

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Jira Connection
              </CardTitle>
              <CardAction>
                {isConfigured ? (
                  <Badge variant="secondary" className="gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">Not Configured</Badge>
                )}
              </CardAction>
              <CardDescription>
                Enter your Jira username, token, and select your Jira instance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Jira Instance */}
              <div className="space-y-2">
                <Label htmlFor="jira-instance">Jira Instance</Label>
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
                    className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
                  >
                    here
                  </a>
                  , → Then Click on{' '}
                  <span className="font-medium">Personal Access Tokens</span> →{' '}
                  <span className="font-medium">Create Token</span>
                </p>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g. ThaoLNP5"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your Jira account username used for logging timesheets.
                </p>
              </div>

              {/* Token */}
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <div className="relative">
                  <Input
                    id="token"
                    type={showToken ? 'text' : 'password'}
                    placeholder="Your token"
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
                <p className="text-xs text-muted-foreground">
                  Token from for API authentication.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {isConfigured && (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/timesheet/logwork">
                        <ArrowLeft className="h-4 w-4" />
                        Go to Log Work
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/timesheet/my-worklogs">
                        <ArrowLeft className="h-4 w-4" />
                        Go to My Worklogs
                      </Link>
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <ActionButton
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleClear}
                  disabled={!isConfigured}
                  leftIcon={<Trash2 />}
                >
                  Clear
                </ActionButton>
                <ActionButton
                  onClick={handleSave}
                  disabled={isSaving || (!hasChanges && isConfigured)}
                  leftIcon={isConfigured && !hasChanges ? <Check /> : <Save />}
                  isLoading={isSaving}
                  loadingText="Verifying..."
                >
                  {isConfigured && !hasChanges ? 'Saved' : 'Save'}
                </ActionButton>
              </div>
            </CardFooter>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
