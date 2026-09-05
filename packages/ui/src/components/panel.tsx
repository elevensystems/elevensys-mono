import * as React from 'react';

import { cn } from '@workspace/ui/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';

const panelVariants = cva(
  'group/panel bg-surface text-foreground flex w-full flex-col overflow-hidden rounded-xl border',
  {
    variants: {
      /**
       * How the body meets the panel's edge.
       *
       * `dense` (the default) runs the body flush to the panel's sides and
       * bottom: 1px negative margins pull its border under the panel's own so
       * the two read as a single line, and `overflow-hidden` clips the
       * redundant edge, leaving the corner arc at full weight.
       *
       * `dense={false}` keeps a 4px gutter all round instead, so the tinted
       * ground frames the body on every side. The body's radius drops one step
       * with it: concentric corners only stay parallel when the inner radius is
       * the outer one minus the gutter, and an inner corner rounder than that
       * bulges past the panel's arc and gets sheared flat by `overflow-hidden`.
       */
      dense: {
        true: [
          'p-0',
          '[&>[data-slot=panel-body]]:-mx-px',
          '[&>[data-slot=panel-body]]:last:-mb-px',
        ],
        false: ['p-1', '[&>[data-slot=panel-body]]:rounded-lg'],
      },
    },
    defaultVariants: {
      dense: true,
    },
  }
);

/**
 * A bordered section that holds one bounded piece of a workspace.
 *
 * `Card` is the standalone unit — it carries its own padding and shadow and
 * reads as an object on the page. `Panel` is the workspace unit: its header
 * sits on a tinted ground and its body is an inset card, so a column of them
 * reads as one surface with labelled regions. Use it for the parts of an
 * editor that sit side by side; use `Card` for a summary tile or a single
 * self-contained form.
 */
function Panel({
  className,
  dense = true,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof panelVariants>) {
  return (
    <div
      data-slot="panel"
      data-dense={dense}
      className={cn(panelVariants({ dense }), className)}
      {...props}
    />
  );
}

/** The label strip, on the panel's tinted ground rather than on the body. */
function PanelHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-header"
      className={cn(
        'flex min-h-[3.25rem] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5',
        className
      )}
      {...props}
    />
  );
}

/**
 * Uppercase and quiet: panels sit side by side, so their names label the
 * workspace rather than announcing themselves.
 */
function PanelTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="panel-title"
      className={cn(
        'text-foreground text-xs font-semibold tracking-[0.06em] uppercase',
        className
      )}
      {...props}
    />
  );
}

/** Actions and notes pushed to the right of the header row. */
function PanelActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-actions"
      className={cn(
        'ml-auto flex flex-wrap items-center gap-x-3 gap-y-1',
        className
      )}
      {...props}
    />
  );
}

/**
 * The panel's content, as a card inset into the tinted ground.
 *
 * How it meets the panel's edge is the parent's `dense` variant, not this
 * component's business. Padding is left to the caller — a body is as often a
 * flush list or table as it is a padded block.
 */
function PanelBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-body"
      className={cn(
        'bg-card text-card-foreground overflow-hidden rounded-xl border',
        className
      )}
      {...props}
    />
  );
}

export {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelActions,
  PanelBody,
  panelVariants,
};
