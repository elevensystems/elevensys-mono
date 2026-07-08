import * as React from 'react';

import { cn } from '@workspace/ui/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import { X } from 'lucide-react';

const tokenVariants = cva(
  'inline-flex max-w-[220px] items-center gap-1 whitespace-nowrap border border-transparent font-sans text-[13px] font-medium leading-none transition-[box-shadow,filter] [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:stroke-[2px]',
  {
    variants: {
      color: {
        default: 'bg-token-default-bg text-token-default-fg',
        gray: 'bg-token-gray-bg text-token-gray-fg',
        red: 'bg-token-red-bg text-token-red-fg',
        orange: 'bg-token-orange-bg text-token-orange-fg',
        yellow: 'bg-token-yellow-bg text-token-yellow-fg',
        green: 'bg-token-green-bg text-token-green-fg',
        teal: 'bg-token-teal-bg text-token-teal-fg',
        cyan: 'bg-token-cyan-bg text-token-cyan-fg',
        blue: 'bg-token-blue-bg text-token-blue-fg',
        purple: 'bg-token-purple-bg text-token-purple-fg',
        pink: 'bg-token-pink-bg text-token-pink-fg',
      },
      shape: {
        rounded: 'rounded-lg',
        pill: 'rounded-full',
      },
      density: {
        comfortable: 'h-6 px-[9px] text-[13px]',
        compact: 'h-[22px] px-2 text-xs',
      },
      clickable: {
        true: 'cursor-pointer hover:brightness-[.965] dark:hover:brightness-[1.12]',
        false: '',
      },
      selected: {
        true: 'shadow-[0_0_0_2px_var(--background),0_0_0_3.5px_var(--ring)]',
        false: '',
      },
      disabled: {
        true: 'opacity-[.42]',
        false: '',
      },
    },
    defaultVariants: {
      color: 'default',
      shape: 'rounded',
      density: 'comfortable',
      clickable: false,
      selected: false,
      disabled: false,
    },
  }
);

interface TokenProps
  extends
    Omit<React.ComponentProps<'span'>, 'color' | 'onClick'>,
    VariantProps<typeof tokenVariants> {
  icon?: React.ReactNode;
  endContent?: React.ReactNode;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}

function Token({
  className,
  color = 'default',
  shape = 'rounded',
  density = 'comfortable',
  disabled = false,
  selected = false,
  icon,
  endContent,
  onClick,
  onRemove,
  removeLabel = 'Remove',
  children,
  ...props
}: TokenProps) {
  const clickable = Boolean(onClick) && !disabled;

  return (
    <span
      data-slot="token"
      data-color={color}
      data-disabled={disabled || undefined}
      data-selected={selected || undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-pressed={clickable ? Boolean(selected) : undefined}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        clickable
          ? event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        tokenVariants({ color, shape, density, clickable, selected, disabled }),
        className
      )}
      {...props}
    >
      {icon}
      <span
        data-slot="token-label"
        className="overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {children}
      </span>
      {endContent}
      {onRemove && !disabled && (
        <button
          type="button"
          data-slot="token-remove"
          aria-label={removeLabel}
          onClick={event => {
            event.stopPropagation();
            onRemove();
          }}
          className="-mr-[3px] ml-0.5 inline-flex items-center justify-center rounded-[5px] p-0.5 text-inherit opacity-[.72] hover:bg-black/[.09] hover:opacity-100 dark:hover:bg-white/[.14]"
        >
          <X className="size-3" strokeWidth={2.4} />
        </button>
      )}
    </span>
  );
}

export { Token, tokenVariants };
export type { TokenProps };
