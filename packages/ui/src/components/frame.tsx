import * as React from 'react';

import { cn } from '@workspace/ui/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';

const frameVariants = cva(
  'group/frame bg-muted/50 text-foreground flex w-full flex-col overflow-hidden rounded-xl border text-sm',
  {
    variants: {
      dense: {
        false: 'p-1',
        // Dense drops the outer gutter so children sit flush inside the frame.
        // They land within its border box, so a side border of their own would
        // sit 1px inboard of the frame's and read as a double line. Square-
        // cornered children just drop theirs. A `rounded` panel can't: without
        // a real side border its corner arc tapers to nothing and looks faded,
        // so it keeps the border and shifts out by 1px (-mx-px) to sit under
        // the frame's, where overflow-hidden clips the redundant edge away and
        // leaves the arc at full weight.
        true: [
          'p-0',
          '[&>[data-slot=frame-panel]]:last:border-b-0',
          '[&>[data-slot=frame-panel]:not([data-rounded=true])]:rounded-none [&>[data-slot=frame-panel]:not([data-rounded=true])]:border-x-0',
          '[&>[data-slot=frame-panel][data-rounded=true]]:rounded-t-xl [&>[data-slot=frame-panel][data-rounded=true]]:rounded-b-none [&>[data-slot=frame-panel][data-rounded=true]]:-mx-px',
          '[&>[data-slot=frame-group]]:rounded-none [&>[data-slot=frame-group]]:border-x-0 [&>[data-slot=frame-group]]:last:border-b-0',
        ],
      },
    },
    defaultVariants: {
      dense: false,
    },
  }
);

function Frame({
  className,
  dense = false,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof frameVariants>) {
  return (
    <div
      data-slot="frame"
      data-dense={dense}
      className={cn(frameVariants({ dense }), className)}
      {...props}
    />
  );
}

function FrameHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="frame-header"
      className={cn('flex flex-col gap-0.5 px-4 py-3', className)}
      {...props}
    />
  );
}

function FrameTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="frame-title"
      className={cn('leading-snug font-semibold', className)}
      {...props}
    />
  );
}

function FrameDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="frame-description"
      className={cn('text-muted-foreground leading-snug', className)}
      {...props}
    />
  );
}

function FramePanel({
  className,
  rounded = false,
  ...props
}: React.ComponentProps<'div'> & {
  /** Keep the top corners rounded even inside a dense Frame. */
  rounded?: boolean;
}) {
  return (
    <div
      data-slot="frame-panel"
      data-rounded={rounded}
      className={cn(
        'bg-background flex flex-col gap-0.5 rounded-lg border px-4 py-3',
        className
      )}
      {...props}
    />
  );
}

const frameGroupVariants = cva('flex flex-col', {
  variants: {
    variant: {
      // The group draws the outer box; each panel keeps only its top border so
      // adjacent panels share a single 1px divider.
      stacked: [
        'bg-background overflow-hidden rounded-lg border',
        '[&>[data-slot=frame-panel]]:rounded-none [&>[data-slot=frame-panel]]:border-x-0 [&>[data-slot=frame-panel]]:border-b-0 [&>[data-slot=frame-panel]]:first:border-t-0',
      ],
      separated: 'gap-2',
    },
  },
  defaultVariants: {
    variant: 'separated',
  },
});

function FrameGroup({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof frameGroupVariants>) {
  return (
    <div
      data-slot="frame-group"
      data-variant={variant}
      className={cn(frameGroupVariants({ variant }), className)}
      {...props}
    />
  );
}

function FrameFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="frame-footer"
      className={cn('text-muted-foreground px-4 py-3 leading-snug', className)}
      {...props}
    />
  );
}

export {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameGroup,
  FrameHeader,
  FramePanel,
  FrameTitle,
  frameGroupVariants,
  frameVariants,
};
