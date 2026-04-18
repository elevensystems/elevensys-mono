import Link from 'next/link';

import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@workspace/ui/components/alert';

interface NotConfiguredAlertProps {
  isConfigured: boolean;
}

export function NotConfiguredAlert({ isConfigured }: NotConfiguredAlertProps) {
  if (isConfigured) return null;

  return (
    <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <span>
          Jira settings not configured.{' '}
          <Link
            href="/timesheet/config"
            className="font-medium underline underline-offset-4 hover:text-yellow-900 dark:hover:text-yellow-100"
          >
            Go to Configs
          </Link>{' '}
          to connect your Jira account.
        </span>
      </AlertDescription>
    </Alert>
  );
}
