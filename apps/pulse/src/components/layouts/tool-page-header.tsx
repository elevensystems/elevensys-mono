import { Banner } from '@workspace/ui/components/banner';
import { cn } from '@workspace/ui/lib/utils';

interface ToolPageHeaderProps {
  title: string;
  description?: string;
  subtitle?: React.ReactNode;
  className?: string;
  infoMessage?: string;
  error?: string;
  /**
   * The page's single primary action, rendered at the end of the title row.
   * Per-item and destructive actions belong next to what they affect.
   */
  actions?: React.ReactNode;
}

export function ToolPageHeader({
  title,
  description,
  subtitle,
  className,
  infoMessage,
  error,
  actions,
}: ToolPageHeaderProps) {
  return (
    <>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-4',
          className ?? 'mb-8'
        )}
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          {/* The subtitle line is always reserved, even when a page has nothing
              to say yet: pages swap its text as they search, and a collapsing
              line would shift everything below it on every state change. */}
          <p className="min-h-5 text-sm text-muted-foreground">
            {subtitle ?? description}
          </p>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {infoMessage && (
        <Banner
          state="info"
          title="Info"
          message={infoMessage}
          className="mb-4"
        />
      )}

      {error && (
        <Banner state="error" title="Error" message={error} className="mb-4" />
      )}
    </>
  );
}
