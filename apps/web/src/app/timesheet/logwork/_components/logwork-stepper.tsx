'use client';

import { Check } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';

const STEPS = [
  { label: 'Find Dates' },
  { label: 'Select Dates' },
  { label: 'Add Entries' },
  { label: 'Submit' },
];

interface LogworkStepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

export function LogworkStepper({ currentStep }: LogworkStepperProps) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((step, index) => {
        const stepNum = (index + 1) as 1 | 2 | 3 | 4;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all',
                  isDone && 'bg-primary text-primary-foreground',
                  isActive && 'bg-primary text-primary-foreground',
                  !isDone && !isActive && 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </span>
              <span
                className={cn(
                  'text-sm whitespace-nowrap transition-colors',
                  isActive ? 'inline font-semibold text-foreground' : 'hidden text-muted-foreground sm:inline'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-px min-w-4 flex-1 transition-colors sm:mx-3 sm:min-w-8',
                  stepNum < currentStep ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
