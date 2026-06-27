import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { cn } from '@workspace/ui/lib/utils';

interface GuestLoginAlertProps {
  title: string;
  className?: string;
}

export default function GuestLoginAlert({
  title,
  className,
}: GuestLoginAlertProps) {
  return (
    <Alert className={cn('border-dashed bg-muted/50', className)}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          You can explore the tool now.{' '}
          <Link
            href="/login"
            className="font-medium underline underline-offset-4 text-color-4 hover:text-color-4/70"
          >
            Log in
          </Link>{' '}
          to enable translation.
        </span>
      </AlertDescription>
    </Alert>
  );
}
