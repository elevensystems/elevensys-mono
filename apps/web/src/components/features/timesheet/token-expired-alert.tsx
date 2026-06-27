import Link from 'next/link';

import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@workspace/ui/components/alert';

interface TokenExpiredAlertProps {
  authError: boolean;
}

export function TokenExpiredAlert({ authError }: TokenExpiredAlertProps) {
  if (!authError) return null;

  return (
    <Alert className="border-color-17/25 bg-color-17/8 text-alert-warning-text dark:border-color-17/30 dark:bg-color-17/10">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <span>
          Your Jira token has expired or is no longer valid.{' '}
          <Link
            href="/timesheet/config"
            className="font-medium underline underline-offset-4 hover:text-alert-warning-text/70"
          >
            Update Token
          </Link>{' '}
          to reconnect.
        </span>
      </AlertDescription>
    </Alert>
  );
}
