import { cn } from '@workspace/ui/lib/utils';

interface GlowPulseBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function GlowPulseBox({ children, className }: GlowPulseBoxProps) {
  return (
    <div
      className="relative rounded-md p-[1px] overflow-hidden"
      style={{ animation: 'glow-pulse 5s ease-in-out infinite' }}
    >
      <div className={cn('relative z-10 rounded-[5px] bg-card p-2', className)}>
        {children}
      </div>
    </div>
  );
}
