import type { ReactNode } from 'react';

import { cn } from '@workspace/ui/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * The one width and gutter every admin page uses.
 *
 * Capped rather than full-bleed so form fields and prose do not stretch into
 * unreadable lines on a wide monitor, and wide enough that the two-column
 * editors and the audit tables still get room. `MainLayout` already applies
 * `p-4`, so the padding here is what sits on top of that.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <section
      className={cn('mx-auto w-full max-w-[100rem] px-4 py-6', className)}
    >
      {children}
    </section>
  );
}
