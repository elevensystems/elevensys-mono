'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';
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
import { MegaphoneOff, Plus, Trash2 } from 'lucide-react';

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
  /** A save is in flight, so deleting now would race it. */
  busy: boolean;
  onEdit: (announcement: SiteAnnouncement) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

/**
 * Which of the target's banners the composer is editing.
 *
 * A target with nothing posted needs no action here: the composer to the right
 * is already holding that target's blank draft, presets and all.
 *
 * Delete sits on each row rather than under the composer: rows exist only for
 * saved banners, so nothing appears or vanishes when a draft is opened.
 *
 * The list is always three rows tall, whatever is posted: rows have a fixed
 * height, a fourth banner scrolls, and the empty state fills the same space.
 * Adding or deleting a banner never moves anything on the page.
 */
export function BannerPickerPanel({
  target,
  saved,
  currentId,
  now,
  busy,
  onEdit,
  onAdd,
  onDelete,
}: BannerPickerPanelProps) {
  return (
    <Panel dense={false}>
      <PanelHeader>
        <PanelTitle>Banners</PanelTitle>
        <PanelActions>
          {/* Always shown, so the header never reflows; disabled while the
              composer already holds a fresh draft it would only wipe. */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!currentId}
            onClick={onAdd}
          >
            <Plus />
            New banner
          </Button>
        </PanelActions>
      </PanelHeader>

      {/* Three 4.25rem rows, plus the body's own top and bottom border. */}
      <PanelBody className="h-[calc(3*4.25rem+2px)] overflow-y-auto">
        {saved.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-3 text-center">
            <MegaphoneOff className="text-muted-foreground size-[18px]" />
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
              const name = entry.title || entry.message;
              const { id } = entry;

              return (
                <li
                  key={entry.id ?? index}
                  className={cn(
                    'flex h-17 items-center border-l-2',
                    open
                      ? 'border-l-primary bg-muted'
                      : 'hover:bg-muted/50 border-l-transparent'
                  )}
                >
                  <button
                    type="button"
                    aria-current={open}
                    onClick={() => onEdit(entry)}
                    className="flex h-full min-w-0 flex-1 flex-col items-start justify-center gap-1 pl-4 text-left"
                  >
                    <span className="w-full truncate text-sm font-medium">
                      {name}
                    </span>
                    {/* One line, so every row keeps the same height. */}
                    <span className="flex w-full min-w-0 items-center gap-2">
                      <Token
                        color={STATE_TOKEN_COLORS[entry.state]}
                        density="compact"
                        className="shrink-0 rounded-[6px] text-[11px] tracking-[0.03em] uppercase"
                      >
                        {STATE_LABELS[entry.state]}
                      </Token>
                      <span
                        className={cn(
                          'min-w-0 truncate text-xs',
                          schedule.status === 'live'
                            ? 'text-token-green-fg'
                            : 'text-muted-foreground'
                        )}
                      >
                        {schedule.label}
                      </span>
                    </span>
                  </button>

                  {/* An entry stored without an id cannot be addressed. */}
                  {id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${name}`}
                          disabled={busy}
                          className="text-muted-foreground hover:text-destructive mx-2 shrink-0"
                        >
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete this {TARGET_LABELS[target]} banner?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            “{name}” disappears for everyone within a few
                            seconds. Any other banners on this target stay up.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => onDelete(id)}
                          >
                            Delete it
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}
