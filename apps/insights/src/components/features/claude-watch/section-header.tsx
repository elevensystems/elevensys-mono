'use client';

import Link from 'next/link';

import { ChevronLeft } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional back link rendered above the title (for detail pages). */
  backHref?: string;
  backLabel?: string;
  /** Optional right-aligned content (e.g. a total + range). */
  right?: React.ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  right,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground mb-1 inline-flex items-center gap-1 text-[12.5px] transition-colors"
          >
            <ChevronLeft className="size-3.5" />
            {backLabel ?? 'Back'}
          </Link>
        )}
        <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-[13px]">{subtitle}</p>
        )}
      </div>
      {right && <div className="text-right">{right}</div>}
    </div>
  );
}
