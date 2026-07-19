'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

import { Spinner } from '@workspace/ui/components/spinner';

// globals.css only defines `:root` (light) and `.dark` popover colors, so
// there's no `.light` class to force a light subtree back off of `.dark`.
// Mirror the two palettes here to force the toast onto the opposite one.
const POPOVER_COLORS = {
  light: {
    bg: 'var(--neutral-0)',
    text: 'var(--neutral-950)',
    border: 'var(--neutral-200)',
  },
  dark: {
    bg: 'var(--neutral-900)',
    text: 'var(--neutral-50)',
    border: 'oklch(1 0 0 / 10%)',
  },
} as const;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  const invertedTheme = resolvedTheme === 'light' ? 'dark' : 'light';
  const colors = POPOVER_COLORS[invertedTheme];

  return (
    <Sonner
      theme={invertedTheme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Spinner />,
      }}
      style={
        {
          '--normal-bg': colors.bg,
          '--normal-text': colors.text,
          '--normal-border': colors.border,
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
