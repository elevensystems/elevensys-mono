import type { ReactNode } from 'react';

import { cn } from '@workspace/ui/lib/utils';

interface PageHeaderProps {
  title: string;
  /** One line on what the page is for. Omit it when the title says enough. */
  description?: ReactNode;
  /**
   * The page's single primary action, rendered at the end of the title row.
   * Per-item and destructive actions belong next to what they affect, not
   * here — this row is scoped to the whole page.
   */
  actions?: ReactNode;
  className?: string;
}

/**
 * Title row of an admin page: what the page is, and the one thing you came
 * here to do.
 *
 * A page whose primary action needs client state renders this from the client
 * component that owns that state; the server page renders it without `actions`
 * on the branches that have nothing to act on (a failed read, an unconfigured
 * store).
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap items-center justify-between gap-4',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
