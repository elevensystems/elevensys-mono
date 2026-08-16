import { Banner } from '@workspace/ui/components/banner';

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
        {/* The subtitle line is always reserved, even when a page has nothing
            to say yet: pages swap its text as they search, and a collapsing
            line would shift everything below it on every state change. */}
        <p className="min-h-5 text-sm text-muted-foreground">
          {subtitle ?? description}
        </p>
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
