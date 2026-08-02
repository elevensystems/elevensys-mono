'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import { cn } from '@workspace/ui/lib/utils';
import { Check } from 'lucide-react';

type StepStatus = 'complete' | 'active' | 'pending';

const StepperContext = createContext<number>(1);

interface LogworkStepperProps {
  /** 1-based index of the step the user is currently on */
  currentStep: number;
  children: ReactNode;
  className?: string;
}

export function LogworkStepper({
  currentStep,
  children,
  className,
}: LogworkStepperProps) {
  return (
    <StepperContext.Provider value={currentStep}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </StepperContext.Provider>
  );
}

interface LogworkStepProps {
  /** 1-based position of this step */
  step: number;
  title: string;
  /** Optional muted note rendered next to the title */
  meta?: ReactNode;
  /** Hides the connector line running down to the next step */
  isLast?: boolean;
  children: ReactNode;
}

export function LogworkStep({
  step,
  title,
  meta,
  isLast,
  children,
}: LogworkStepProps) {
  const currentStep = useContext(StepperContext);
  const status: StepStatus =
    step < currentStep
      ? 'complete'
      : step === currentStep
        ? 'active'
        : 'pending';

  return (
    <div className={cn('relative flex gap-3 sm:gap-4', !isLast && 'pb-8')}>
      {/* Connector — runs from below the indicator to the next step */}
      {!isLast && (
        <div
          aria-hidden
          className={cn(
            'absolute top-7 bottom-0 left-3 -ml-px w-0.5 rounded-full transition-colors',
            status === 'complete' ? 'bg-primary' : 'bg-border'
          )}
        />
      )}

      <span
        className={cn(
          'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all',
          status === 'pending'
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary text-primary-foreground',
          status === 'active' && 'ring-4 ring-primary/15'
        )}
      >
        {status === 'complete' ? <Check className="size-3.5" /> : step}
      </span>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex min-h-6 flex-wrap items-center gap-2">
          <h2
            className={cn(
              'text-sm font-semibold transition-colors',
              status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            {title}
          </h2>
          {meta && (
            <span className="text-sm text-muted-foreground">{meta}</span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
