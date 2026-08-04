'use client';

import Link from 'next/link';

import { Banner } from '@workspace/ui/components/banner';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { ArrowRight, ClipboardList, FolderSearch, PenLine } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';

const secondaryFeatures = [
  {
    title: 'My Worklogs',
    description:
      'Your logged hours and approval status, searchable by date range.',
    href: '/timesheet/my-worklogs',
    icon: ClipboardList,
  },
  {
    title: 'Project Worklogs',
    description:
      "A project's worklogs, filtered by person, type of work, and status.",
    href: '/timesheet/project-worklogs',
    icon: FolderSearch,
  },
] as const;

export default function TimesheetPage() {
  const { isConfigured, isLoaded } = useTimesheetSettings();

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <ToolPageHeader title="Timesheet" />

          {isLoaded && !isConfigured && (
            <Banner
              state="warning"
              title="Getting started"
              message="Head to Settings to configure your Jira username, token, and instance before logging work."
              action={{ label: 'Go to Configs', href: '/config' }}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3 h-full justify-between gap-8 border-0 bg-zinc-900 py-8 text-zinc-50 dark:bg-white dark:text-zinc-900">
              <CardHeader className="px-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 dark:bg-zinc-900/10">
                  <PenLine className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-8">
                <h2 className="text-2xl font-bold">Log work</h2>
                <p className="leading-relaxed text-zinc-300 dark:text-zinc-600">
                  Add entries with issue keys, type of work, and hours — then
                  submit a whole date range to Jira in one pass.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-2 bg-white text-zinc-900 hover:bg-white/90 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-900/90"
                >
                  <Link href="/timesheet/logwork">
                    Open Log Work
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6 lg:col-span-2">
              {secondaryFeatures.map(feature => (
                <Link key={feature.title} href={feature.href} className="group">
                  <Card className="h-full transition-colors group-hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <feature.icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <h3 className="mt-2 text-lg font-semibold">
                        {feature.title}
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
