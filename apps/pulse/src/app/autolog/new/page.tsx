'use client';

import { useRouter } from 'next/navigation';

import { Spinner } from '@workspace/ui/components/spinner';

import { ConfigForm } from '@/components/features/autolog/config-form';
import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useAutolog } from '@/hooks/use-autolog';
import { useProjects } from '@/hooks/use-projects';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';

export default function NewAutologConfigPage() {
  const router = useRouter();
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();
  const { createConfig } = useAutolog({
    username: settings.username,
    token: settings.token,
    isConfigured,
  });
  const { projects, isLoading: isLoadingProjects } = useProjects({
    settings,
    isConfigured,
  });

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
        <div className="max-w-full mx-auto space-y-6">
          {!isConfigured && (
            <>
              <ToolPageHeader title="New Configuration" />
              <NotConfiguredAlert isConfigured={false} />
            </>
          )}

          {isConfigured && (
            <ConfigForm
              settings={settings}
              projects={projects}
              isLoadingProjects={isLoadingProjects}
              onSave={createConfig}
              onCancel={() => router.push('/autolog')}
              header={<ToolPageHeader title="New Configuration" className="" />}
            />
          )}
        </div>
      </section>
    </MainLayout>
  );
}
