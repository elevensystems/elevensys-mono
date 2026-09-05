'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Panel,
  PanelActions,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from '@workspace/ui/components/panel';
import { Token } from '@workspace/ui/components/token';
import type { SiteAnnouncement } from '@workspace/ui/lib/site-announcement';
import { cn } from '@workspace/ui/lib/utils';
import { MegaphoneOff, Plus } from 'lucide-react';

import {
  STATE_LABELS,
  STATE_TOKEN_COLORS,
  TARGET_LABELS,
  describeSchedule,
} from '@/lib/site-banner-schema';
import type { SiteBannerTarget } from '@/types/site-banner';

interface BannerPickerPanelProps {
  target: SiteBannerTarget;
  /** Everything already posted on `target`, in stored order. */
  saved: SiteAnnouncement[];
  /** Id of the announcement open in the composer, or `''` for a fresh draft. */
  currentId: string;
  /** Browser clock, or `null` before the editor has mounted. */
  now: number | null;
  onEdit: (announcement: SiteAnnouncement) => void;
  onAdd: () => void;
}

/**
 * Which of the target's banners the composer is editing.
 *
 * A target with nothing posted needs no action here: the composer to the right
 * is already holding that target's blank draft, presets and all.
 */
export function BannerPickerPanel({
  target,
  saved,
  currentId,
  now,
  onEdit,
  onAdd,
}: BannerPickerPanelProps) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Banners</PanelTitle>
        {saved.length > 0 && (
          <PanelActions>
            <Button type="button" variant="outline" size="sm" onClick={onAdd}>
              <Plus />
              New banner
            </Button>
          </PanelActions>
        )}
      </PanelHeader>

      <PanelBody>
        {saved.length === 0 ? (
          <div className="flex flex-col items-center gap-3.5 px-4 py-6 text-center">
            <MegaphoneOff className="text-muted-foreground size-[22px]" />
            <div>
              <p className="text-sm font-medium">
                Nothing posted on {TARGET_LABELS[target]}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[13px]">
                Write one in the composer, or start it from a preset.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {saved.map((entry, index) => {
              const open = entry.id === currentId;
              const schedule = describeSchedule(entry, now);

              return (
                <li key={entry.id ?? index}>
                  <button
                    type="button"
                    aria-current={open}
                    onClick={() => onEdit(entry)}
                    className={cn(
                      'flex w-full flex-col items-start gap-1 border-l-2 px-4 py-3 text-left',
                      open
                        ? 'border-l-primary bg-muted'
                        : 'hover:bg-muted/50 border-l-transparent'
                    )}
                  >
                    <span className="w-full truncate text-sm font-medium">
                      {entry.title || entry.message}
                    </span>
                    <span className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <Token
                        color={STATE_TOKEN_COLORS[entry.state]}
                        density="compact"
                        className="rounded-[6px] text-[11px] tracking-[0.03em] uppercase"
                      >
                        {STATE_LABELS[entry.state]}
                      </Token>
                      <span
                        className={cn(
                          'min-w-0 text-xs',
                          schedule.status === 'live'
                            ? 'text-token-green-fg'
                            : 'text-muted-foreground'
                        )}
                      >
                        {schedule.label}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}
