import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';
import { CircleCheckBig, CircleX, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';

const bannerVariants = cva('flex w-full gap-3 font-sans transition-colors', {
  variants: {
    state: {
      info: 'bg-banner-info-bg text-banner-info-fg',
      success: 'bg-banner-success-bg text-banner-success-fg',
      warning: 'bg-banner-warning-bg text-banner-warning-fg',
      error: 'bg-banner-error-bg text-banner-error-fg',
    },
    flush: {
      true: 'rounded-none px-6 py-4',
      false: 'rounded-lg px-4 py-3.5',
    },
  },
  defaultVariants: {
    state: 'info',
    flush: false,
  },
});

const STATE_ICONS: Record<
  NonNullable<VariantProps<typeof bannerVariants>['state']>,
  LucideIcon
> = {
  info: Info,
  success: CircleCheckBig,
  warning: TriangleAlert,
  error: CircleX,
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
  const centered = Boolean(action);
  const actionClasses =
    'shrink-0 whitespace-nowrap rounded-sm bg-[color-mix(in_oklab,currentColor_12%,transparent)] px-4 py-2 text-sm font-medium text-inherit transition-colors hover:bg-[color-mix(in_oklab,currentColor_20%,transparent)]';

  return (
    <div
      data-slot="banner"
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
      className={cn(
        bannerVariants({ state, flush }),
        centered ? 'items-center' : 'items-start',
        className
      )}
      {...props}
    >
      <Icon
        data-slot="banner-icon"
        className="mt-px size-5 shrink-0 self-start"
        strokeWidth={1.75}
      />

      <div className="min-w-0 flex-1">
        {title ? (
          <>
            <div data-slot="banner-title" className="text-[15px] leading-[1.35] font-semibold">
              {title}
            </div>
            <div
              data-slot="banner-body"
              className="mt-0.5 text-[13.5px] leading-[1.45] opacity-[.82]"
            >
              {message}
            </div>
          </>
        ) : (
          <div data-slot="banner-title" className="text-[15px] leading-[1.35] font-semibold">
            {message}
          </div>
        )}
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
          data-slot="banner-dismiss"
          aria-label="Dismiss"
          onClick={onDismiss}
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-[8px] text-inherit transition-colors hover:bg-[color-mix(in_oklab,currentColor_14%,transparent)]',
            !centered && '-mt-0.5'
          )}
        >
          <X className="size-[18px]" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

export { Banner, bannerVariants };
export type { BannerProps, BannerAction };
