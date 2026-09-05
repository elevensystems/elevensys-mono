'use client';

import {
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from '@workspace/ui/components/panel';
import type { SiteAnnouncement } from '@workspace/ui/lib/site-announcement';

import {
  SITE_BANNER_TARGETS,
  TARGET_LABELS,
  summarizeTarget,
} from '@/lib/site-banner-schema';
import type { SiteBannerTarget } from '@/types/site-banner';

interface BannerTargetPanelProps {
  target: SiteBannerTarget;
  values: Partial<Record<SiteBannerTarget, SiteAnnouncement[]>>;
  /** Browser clock, or `null` before the editor has mounted. */
  now: number | null;
  onSelect: (target: SiteBannerTarget) => void;
}

/**
 * Which apps the banners being edited belong to.
 *
 * Every target is on screen at once, with what is posted on each: the list is
 * five rows long and never changes height, so picking a target cannot shift
 * the composer beside it.
 */
export function BannerTargetPanel({
  target,
  values,
  now,
  onSelect,
}: BannerTargetPanelProps) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Target</PanelTitle>
      </PanelHeader>
      <PanelBody>
        <ul className="divide-y">
          {SITE_BANNER_TARGETS.map(option => (
            <li key={option}>
              <label
                className="hover:bg-muted/50 has-checked:bg-muted flex cursor-pointer items-center gap-3 px-4 py-2.5"
                data-target={option}
              >
                <input
                  type="radio"
                  name="site-banner-target"
                  value={option}
                  checked={option === target}
                  onChange={() => onSelect(option)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="border-input bg-background peer-checked:border-primary peer-focus-visible:ring-ring/50 size-3.5 shrink-0 rounded-full border transition-[border-width,border-color] peer-checked:border-4 peer-focus-visible:ring-[3px]"
                />
                <span className="min-w-0 flex-1 peer-checked:font-medium">
                  <span className="block truncate text-sm">
                    {TARGET_LABELS[option]}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block truncate text-xs font-normal">
                    {summarizeTarget(values[option], now)}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </PanelBody>
    </Panel>
  );
}
