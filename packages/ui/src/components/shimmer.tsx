import * as React from 'react';

import { cn } from '@workspace/ui/lib/utils';
import { Slot } from 'radix-ui';

interface ShimmerProps extends React.ComponentProps<'span'> {
  /**
   * Merge shimmer styles onto the immediate child instead of rendering a wrapper span.
   */
  asChild?: boolean;
  /**
   * Whether the shimmer animation is applied.
   * @default true
   */
  active?: boolean;
}

/**
 * Applies shadcn's `shimmer` utility to text. Tune the effect via the
 * `shimmer-color-*`, `shimmer-duration-*`, `shimmer-spread-*`, `shimmer-angle-*`,
 * and `shimmer-once` utilities passed through `className`.
 */
export function Shimmer({
  asChild = false,
  active = true,
  className,
  ...props
}: ShimmerProps) {
  const Comp = asChild ? Slot.Root : 'span';

  return <Comp className={cn(active && 'shimmer', className)} {...props} />;
}
