'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { PlusCircle } from 'lucide-react';

import { ConfigCard } from '@/components/features/autolog/config-card';
import { ConfigDetailSheet } from '@/components/features/autolog/config-detail-sheet';
import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useAutolog } from '@/hooks/use-autolog';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import type { AutologConfig } from '@/types/autolog';

export default function AutologPage() {
  const router = useRouter();
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();
  const { configs, isLoading, deleteConfig, runConfig, canAddMore } =
    useAutolog({
      username: settings.username,
      token: settings.token,
      isConfigured,
    });

  const [selectedConfig, setSelectedConfig] = useState<AutologConfig | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleCardClick = (config: AutologConfig) => {
    setSelectedConfig(config);
    setSheetOpen(true);
  };

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          <ToolPageHeader
            title="Autolog"
            description="Automatically log work to Jira on a weekly or monthly schedule."
          />

          {isLoaded && !isConfigured && (
            <NotConfiguredAlert isConfigured={false} />
          )}

          {isLoaded && isConfigured && (
            <div className="space-y-6 mt-6">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {configs.length} / 3 configurations
                </p>
                <Button
                  onClick={() => router.push('/timesheet/autolog/new')}
                  disabled={!canAddMore}
                  size="sm"
                >
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  Add Config
                </Button>
              </div>

              {/* Loading state */}
              {isLoading && (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-5 w-14 rounded-full" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-48" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && configs.length === 0 && (
                <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                  <p className="text-sm">No autolog configurations yet.</p>
                  <p className="text-xs mt-1">
                    Click &ldquo;Add Config&rdquo; to get started.
                  </p>
                </div>
              )}

              {/* Config cards — vertical stack */}
              {!isLoading && configs.length > 0 && (
                <div className="space-y-3">
                  {configs.map(config => (
                    <ConfigCard
                      key={config.configId}
                      config={config}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <ConfigDetailSheet
        config={selectedConfig}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={deleteConfig}
        onRun={runConfig}
      />
    </MainLayout>
  );
}
