import { Info, OctagonX } from 'lucide-react';

import { Alert, AlertDescription } from '@workspace/ui/components/alert';

interface ToolPageHeaderProps {
  title: string;
  description?: string;
  subtitle?: React.ReactNode;
  className?: string;
  infoMessage?: string;
  error?: string;
}

export function ToolPageHeader({
  title,
  description,
  subtitle,
  className,
  infoMessage,
  error,
}: ToolPageHeaderProps) {
  return (
    <>
      <div className={className ?? 'mb-8'}>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        {subtitle ?? (description && <p className="text-sm text-muted-foreground">{description}</p>)}
      </div>

      {infoMessage && (
        <Alert className="mb-4 border-color-4/25 bg-color-4/8 text-alert-info-text [&>svg]:text-alert-info-text dark:border-color-4/30 dark:bg-color-4/10">
          <Info />
          <AlertDescription>
            {infoMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert
          variant="destructive"
          className="mb-4 border-color-6/25 bg-color-6/8 text-alert-error-text [&>svg]:text-alert-error-text dark:border-color-6/30 dark:bg-color-6/10"
        >
          <OctagonX />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
