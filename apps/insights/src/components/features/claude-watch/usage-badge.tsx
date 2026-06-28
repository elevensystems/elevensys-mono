'use client';

import type { ReactNode } from 'react';

import { hexA } from '@/components/features/claude-watch/lib/colors';

interface UsageBadgeProps {
  children: ReactNode;
  color: string;
  small?: boolean;
  mono?: boolean;
  dot?: boolean;
}

/** Pill badge tinted with an arbitrary categorical color (model, tool, etc.). */
export function UsageBadge({
  children,
  color,
  small = false,
  mono = false,
  dot = false,
}: UsageBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium leading-normal ${
        mono ? 'font-mono' : ''
      } ${small ? 'px-[7px] py-px text-[10.5px]' : 'px-[9px] py-0.5 text-[11.5px]'}`}
      style={{
        color,
        background: hexA(color, 0.14),
        borderColor: hexA(color, 0.28),
      }}
    >
      {dot && (
        <span
          className="h-[5px] w-[5px] rounded-full"
          style={{ background: color }}
        />
      )}
      {children}
    </span>
  );
}

/** Monospace code chip (branch names, commands). */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="bg-muted text-foreground/80 border-border whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[11px]">
      {children}
    </span>
  );
}

/** Compact row of developer-id chips with a tooltip-style title. */
export function TopUsers({
  users,
}: {
  users: { developerId: string; title: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {users.map((u, i) => (
        <span
          key={i}
          title={u.title}
          className="bg-muted text-foreground/80 border-border whitespace-nowrap rounded-md border px-[7px] py-0.5 font-mono text-[10.5px]"
        >
          {u.developerId}
        </span>
      ))}
    </div>
  );
}
