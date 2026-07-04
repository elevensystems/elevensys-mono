'use client';

import type { ReactNode } from 'react';

import { cn } from '@workspace/ui/lib/utils';

interface UsageCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned header content (legends, actions). */
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Titled panel matching the tracker's card layout, themed via tokens. */
export function UsageCard({
  title,
  subtitle,
  right,
  children,
  className,
  bodyClassName,
}: UsageCardProps) {
  return (
    <div
      className={cn(
        'bg-card flex min-w-0 flex-col rounded-xl border p-5',
        className
      )}
    >
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <div className="text-[13.5px] font-semibold">{title}</div>
            )}
            {subtitle && (
              <div className="text-muted-foreground mt-0.5 text-[11.5px]">
                {subtitle}
              </div>
            )}
          </div>
          {right}
        </div>
      )}
      <div className={cn('min-w-0', bodyClassName)}>{children}</div>
    </div>
  );
}
