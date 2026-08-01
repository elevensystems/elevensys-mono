import * as React from 'react';

import { cn } from '@workspace/ui/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import {
  CircleCheck,
  CircleX,
  Info,
  type LucideIcon,
  TriangleAlert,
} from 'lucide-react';

const fieldMessageVariants = cva('transition-colors', {
  variants: {
    state: {
      none: '',
      info: '',
      success: '',
      warning: '',
      error: '',
    },
    /**
     * `attached` tints the whole wrapper so the message sits flush under the
     * control; `detached` floats the message as its own panel below it.
     */
    variant: {
      attached: 'rounded-lg',
      detached: '',
    },
  },
  compoundVariants: [
    { variant: 'attached', state: 'info', class: 'bg-banner-info-bg' },
    { variant: 'attached', state: 'success', class: 'bg-banner-success-bg' },
    { variant: 'attached', state: 'warning', class: 'bg-banner-warning-bg' },
    { variant: 'attached', state: 'error', class: 'bg-banner-error-bg' },
  ],
  defaultVariants: {
    state: 'none',
    variant: 'attached',
  },
});

type FieldMessageState = NonNullable<
  VariantProps<typeof fieldMessageVariants>['state']
>;
type FieldMessageVariant = NonNullable<
  VariantProps<typeof fieldMessageVariants>['variant']
>;

const CONTROL_BORDERS: Record<FieldMessageState, string> = {
  none: 'border-border',
  info: 'border-banner-info-fg/40',
  success: 'border-success',
  warning: 'border-warning',
  error: 'border-destructive',
};

const MESSAGE_TINTS: Record<FieldMessageState, string> = {
  none: '',
  info: 'bg-banner-info-bg',
  success: 'bg-banner-success-bg',
  warning: 'bg-banner-warning-bg',
  error: 'bg-banner-error-bg',
};

const MESSAGE_COLORS: Record<FieldMessageState, string> = {
  none: 'text-muted-foreground',
  info: 'text-banner-info-fg',
  success: 'text-banner-success-fg',
  warning: 'text-banner-warning-fg',
  error: 'text-banner-error-fg',
};

const STATE_ICONS: Record<FieldMessageState, LucideIcon | null> = {
  none: null,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
};

interface FieldMessageProps extends React.ComponentProps<'div'> {
  /** Validation state; drives the tint, control border, and icon. */
  state?: FieldMessageState;
  /** `attached` (default) hugs the control; `detached` floats below it. */
  variant?: FieldMessageVariant;
  /** Message shown under the control. When empty, only the control renders. */
  message?: React.ReactNode;
  /** Defaults to on for `detached`, off for `attached`. */
  showIcon?: boolean;
  /** Classes for the box wrapping `children` (the validated control). */
  controlClassName?: string;
  messageClassName?: string;
}

/**
 * Wraps a form control with an inline validation message: the control keeps a
 * state-colored border and the message sits in a soft tinted panel below it.
 * `children` is optional — omit it to render the message panel on its own.
 */
function FieldMessage({
  state = 'error',
  variant = 'attached',
  message,
  showIcon,
  className,
  controlClassName,
  messageClassName,
  children,
  ...props
}: FieldMessageProps) {
  const resolvedState: FieldMessageState = message ? state : 'none';
  const Icon = STATE_ICONS[resolvedState];
  const urgent = resolvedState === 'error' || resolvedState === 'warning';
  const withIcon = showIcon ?? variant === 'detached';
  const detached = variant === 'detached';

  return (
    <div
      data-slot="field-message"
      data-state={resolvedState}
      data-variant={variant}
      className={cn(
        fieldMessageVariants({ state: resolvedState, variant }),
        className
      )}
      {...props}
    >
      {children != null && (
        <div
          data-slot="field-message-control"
          className={cn(
            'rounded-lg border bg-card',
            CONTROL_BORDERS[resolvedState],
            controlClassName
          )}
        >
          {children}
        </div>
      )}

      {message && (
        <div
          data-slot="field-message-text"
          role={urgent ? 'alert' : 'status'}
          aria-live={urgent ? 'assertive' : 'polite'}
          className={cn(
            'flex items-start gap-2 px-3.5 py-2.5 text-sm leading-snug',
            MESSAGE_COLORS[resolvedState],
            detached && [
              'rounded-lg',
              MESSAGE_TINTS[resolvedState],
              children != null && 'mt-2',
            ],
            messageClassName
          )}
        >
          {withIcon && Icon && (
            <Icon className="mt-px size-4 shrink-0" strokeWidth={2} />
          )}
          <span className="min-w-0">{message}</span>
        </div>
      )}
    </div>
  );
}

export { FieldMessage, fieldMessageVariants };
export type { FieldMessageProps, FieldMessageState, FieldMessageVariant };
