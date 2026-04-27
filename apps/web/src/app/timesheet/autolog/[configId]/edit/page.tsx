'use client';

import { use } from 'react';

import { useRouter } from 'next/navigation';

import { ConfigForm } from '@/components/features/autolog/config-form';
import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Spinner } from '@workspace/ui/components/spinner';
import { useAutolog } from '@/hooks/use-autolog';
import { useProjects } from '@/hooks/use-projects';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';

interface EditAutologConfigPageProps {
  params: Promise<{ configId: string }>;
}

export default function EditAutologConfigPage({
  params,
}: EditAutologConfigPageProps) {
  const { configId } = use(params);
  const router = useRouter();
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();
  const { configs, isLoading, updateConfig } = useAutolog({
    username: settings.username,
    token: settings.token,
    jiraInstance: settings.jiraInstance,
    isConfigured,
  });
  const { projects, isLoading: isLoadingProjects } = useProjects({
    settings,
    isConfigured,
  });

  const config = configs.find(c => c.configId === configId);

  if (!isLoaded || isLoading) {
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

  if (!config) {
    return (
      <MainLayout>
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-full mx-auto space-y-6">
            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              <p className="text-sm">Configuration not found.</p>
            </div>
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto space-y-6">
          <ToolPageHeader
            title="Edit Configuration"
            description={`Editing autolog configuration for ${config.projectName}.`}
          />

          <NotConfiguredAlert isConfigured={isConfigured} />

          {isConfigured && (
            <ConfigForm
              settings={settings}
              projects={projects}
              isLoadingProjects={isLoadingProjects}
              editing={config}
              onSave={payload => updateConfig(configId, payload)}
              onCancel={() => router.push('/timesheet/autolog')}
            />
          )}
        </div>
      </section>
    </MainLayout>
  );
}
