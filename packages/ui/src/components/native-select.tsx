import * as React from 'react';

import { cn } from '@workspace/ui/lib/utils';
import { ChevronDown } from 'lucide-react';

interface NativeSelectProps extends React.ComponentProps<'select'> {
  containerClassName?: string;
}

function NativeSelect({
  className,
  containerClassName,
  children,
  ...props
}: NativeSelectProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      <select
        data-slot="native-select"
        className={cn(
          'bg-background text-foreground border-input h-9 w-full appearance-none rounded-md border px-3 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { NativeSelect };
