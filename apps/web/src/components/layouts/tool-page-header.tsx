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
        {subtitle ?? (description && <p className="text-sm text-muted-foreground">{description}</p>)}
      </div>

      {infoMessage && (
        <Banner state="info" title="Info" message={infoMessage} className="mb-4" />
      )}

      {error && (
        <Banner state="error" title="Error" message={error} className="mb-4" />
      )}
    </>
  );
}
