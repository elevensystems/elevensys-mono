import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';
import {
  CircleCheck,
  Info,
  OctagonAlert,
  Sparkles,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';

const bannerVariants = cva(
  "flex w-full items-center gap-3 box-border border pl-[15px] pr-3 py-[11px] font-sans [&_[data-slot=banner-icon]]:shrink-0 [&_[data-slot=banner-icon]]:self-start [&_[data-slot=banner-icon]]:mt-px",
  {
    variants: {
      state: {
        info: 'bg-banner-info-bg border-banner-info-border [&_[data-slot=banner-icon]]:text-banner-info-icon [&_[data-slot=banner-title]]:text-banner-info-title [&_[data-slot=banner-action]]:text-banner-info-icon [&_[data-slot=banner-action]]:border-banner-info-border',
        success:
          'bg-banner-success-bg border-banner-success-border [&_[data-slot=banner-icon]]:text-banner-success-icon [&_[data-slot=banner-title]]:text-banner-success-title [&_[data-slot=banner-action]]:text-banner-success-icon [&_[data-slot=banner-action]]:border-banner-success-border',
        warning:
          'bg-banner-warning-bg border-banner-warning-border [&_[data-slot=banner-icon]]:text-banner-warning-icon [&_[data-slot=banner-title]]:text-banner-warning-title [&_[data-slot=banner-action]]:text-banner-warning-icon [&_[data-slot=banner-action]]:border-banner-warning-border',
        error:
          'bg-banner-error-bg border-banner-error-border [&_[data-slot=banner-icon]]:text-banner-error-icon [&_[data-slot=banner-title]]:text-banner-error-title [&_[data-slot=banner-action]]:text-banner-error-icon [&_[data-slot=banner-action]]:border-banner-error-border',
        promo:
          'bg-banner-promo-bg border-banner-promo-border [&_[data-slot=banner-icon]]:text-banner-promo-icon [&_[data-slot=banner-title]]:bg-[image:var(--banner-promo-grad)] [&_[data-slot=banner-title]]:bg-clip-text [&_[data-slot=banner-title]]:text-transparent [&_[data-slot=banner-action]]:text-banner-promo-icon [&_[data-slot=banner-action]]:border-banner-promo-border',
      },
      flush: {
        true: 'rounded-none border-x-0 border-t',
        false: 'rounded-xl',
      },
    },
    defaultVariants: {
      state: 'info',
      flush: false,
    },
  }
);

const STATE_ICONS: Record<
  NonNullable<VariantProps<typeof bannerVariants>['state']>,
  LucideIcon
> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: OctagonAlert,
  promo: Sparkles,
};

interface BannerAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BannerProps
  extends Omit<React.ComponentProps<'div'>, 'title'>,
    VariantProps<typeof bannerVariants> {
  title?: string;
  message: string;
  action?: BannerAction;
  onDismiss?: () => void;
}

function Banner({
  className,
  state = 'info',
  flush,
  title,
  message,
  action,
  onDismiss,
  ...props
}: BannerProps) {
  const Icon = STATE_ICONS[state ?? 'info'];
  const urgent = state === 'error' || state === 'warning';
  const actionClasses =
    'shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-[13px] font-semibold leading-none transition-colors hover:bg-banner-action-hover';

  return (
    <div
      data-slot="banner"
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
      className={cn(bannerVariants({ state, flush }), className)}
      {...props}
    >
      <Icon data-slot="banner-icon" className="size-5" strokeWidth={1.85} />

      <div className="min-w-0 flex-1 text-sm leading-snug">
        {title && (
          <span data-slot="banner-title" className="font-semibold">
            {title}
          </span>
        )}
        <span data-slot="banner-body" className="text-banner-body">
          {title ? ` — ${message}` : message}
        </span>
      </div>

      {action &&
        (action.href ? (
          <a
            data-slot="banner-action"
            href={action.href}
            onClick={action.onClick}
            className={actionClasses}
          >
            {action.label}
          </a>
        ) : (
          <button
            type="button"
            data-slot="banner-action"
            onClick={action.onClick}
            className={actionClasses}
          >
            {action.label}
          </button>
        ))}

      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="grid size-[30px] shrink-0 place-items-center rounded-lg text-banner-dismiss transition-colors hover:bg-banner-dismiss-hover"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export { Banner, bannerVariants };
export type { BannerProps, BannerAction };
