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
        <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200 dark:[&>svg]:text-blue-200">
          <Info />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            {infoMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert
          variant="destructive"
          className="mb-4 border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200 dark:[&>svg]:text-red-200"
        >
          <OctagonX />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
