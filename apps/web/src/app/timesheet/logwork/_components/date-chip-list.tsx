'use client';

import { useEffect, useRef, useState } from 'react';

import { X } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';

interface DateChipListProps {
  dates: Date[];
  manualDateKeys: Set<string>;
  onRemove: (date: Date) => void;
}

function formatChip(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function DateChipList({
  dates,
  manualDateKeys,
  onRemove,
}: DateChipListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

  const updateFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 0);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  };

  // Scroll to end and update fades whenever dates change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    // Update fades after scroll settles
    const timer = setTimeout(updateFades, 300);
    return () => clearTimeout(timer);
  }, [dates.length]);

  // Update fades when dates change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 0);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }, [dates]);

  if (dates.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">
        No dates selected. Use &quot;Find Dates&quot; or add manually below.
      </span>
    );
  }

  return (
    <div className="relative">
      {showTopFade && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 z-10 rounded-t-sm bg-gradient-to-b from-muted/60 to-transparent" />
      )}
      <div
        ref={scrollRef}
        onScroll={updateFades}
        className="overflow-y-auto max-h-[122px] flex flex-wrap gap-1.5 content-start p-0.5"
      >
        {sorted.map(date => {
          const key = date.toISOString().split('T')[0];
          const isManual = manualDateKeys.has(key);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onRemove(date)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                isManual
                  ? 'border-color-4/50 bg-color-4/10 text-color-4'
                  : isWeekend
                    ? 'border-color-2/50 bg-color-2/10 text-color-2'
                    : 'border-border bg-muted/50 text-foreground',
                'hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive cursor-pointer'
              )}
              title={`Remove ${formatChip(date)}`}
            >
              {formatChip(date)}
              <X className="size-3" />
            </button>
          );
        })}
      </div>
      {showBottomFade && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 z-10 rounded-b-sm bg-gradient-to-t from-muted/60 to-transparent" />
      )}
    </div>
  );
}
