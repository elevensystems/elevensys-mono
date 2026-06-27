import Link from 'next/link';

import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@workspace/ui/components/alert';

interface NotConfiguredAlertProps {
  isConfigured: boolean;
}

export function NotConfiguredAlert({ isConfigured }: NotConfiguredAlertProps) {
  if (isConfigured) return null;

  return (
    <Alert className="border-color-17/25 bg-color-17/8 text-alert-warning-text dark:border-color-17/30 dark:bg-color-17/10">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <span>
          Jira settings not configured.{' '}
          <Link
            href="/timesheet/config"
            className="font-medium underline underline-offset-4 hover:text-alert-warning-text/70"
          >
            Go to Configs
          </Link>{' '}
          to connect your Jira account.
        </span>
      </AlertDescription>
    </Alert>
  );
}
