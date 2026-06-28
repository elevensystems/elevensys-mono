'use client';

import { AlertCircle } from 'lucide-react';

import { Skeleton } from '@workspace/ui/components/skeleton';

/** Generic loading skeleton for a usage view. */
export function UsageLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-md" />
        ))}
      </div>
    </div>
  );
}

/** Friendly error state with the proxy/backend message. */
export function UsageError({ message }: { message: string }) {
  return (
    <div className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-3 rounded-xl border p-4 text-sm">
      <AlertCircle className="mt-0.5 size-4 flex-none" />
      <div>
        <div className="font-medium">Couldn’t load usage data</div>
        <div className="text-destructive/80 mt-1 font-mono text-xs">{message}</div>
      </div>
    </div>
  );
}
