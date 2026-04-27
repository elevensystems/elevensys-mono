'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Minus, Plus } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import {
  DEFAULT_HOURS,
  HOUR_STEP,
  MAX_HOURS,
  MIN_HOURS,
} from '@/lib/timesheet';
import { cn } from '@workspace/ui/lib/utils';

interface HoursStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function HoursStepper({
  value,
  onChange,
  min = MIN_HOURS,
  max = MAX_HOURS,
  step = HOUR_STEP,
  disabled = false,
}: HoursStepperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const valueBeforeEditRef = useRef(value);

  const canDecrement = value > min;
  const canIncrement = value < max;

  const handleDecrement = useCallback(() => {
    if (disabled) return;
    const next = clamp(roundToStep(value - step, step), min, max);
    onChange(next);
    if (isEditing) {
      setEditValue(String(parseFloat(next.toFixed(1))));
    }
  }, [value, step, min, max, onChange, disabled, isEditing]);

  const handleIncrement = useCallback(() => {
    if (disabled) return;
    const next = clamp(roundToStep(value + step, step), min, max);
    onChange(next);
    if (isEditing) {
      setEditValue(String(parseFloat(next.toFixed(1))));
    }
  }, [value, step, min, max, onChange, disabled, isEditing]);

  const enterEditMode = useCallback(() => {
    if (disabled) return;
    valueBeforeEditRef.current = value;
    setEditValue(String(parseFloat(value.toFixed(2))));
    setIsEditing(true);
  }, [value, disabled]);

  const commitEdit = useCallback(() => {
    const parsed = parseFloat(editValue);
    if (isNaN(parsed) || parsed <= 0) {
      onChange(DEFAULT_HOURS);
    } else {
      onChange(clamp(parsed, min, max));
    }
    setIsEditing(false);
  }, [editValue, min, max, onChange]);

  const cancelEdit = useCallback(() => {
    onChange(valueBeforeEditRef.current);
    setIsEditing(false);
  }, [onChange]);

  // Auto-focus and select input text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
        // Return focus to container after commit
        containerRef.current?.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
        containerRef.current?.focus();
      }
    },
    [commitEdit, cancelEdit]
  );

  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        enterEditMode();
      }
    },
    [isEditing, handleIncrement, handleDecrement, enterEditMode]
  );

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Hours"
      tabIndex={isEditing ? -1 : 0}
      onKeyDown={handleContainerKeyDown}
      className={cn(
        'inline-flex h-8 items-center gap-1 rounded-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7 shrink-0"
        disabled={disabled || !canDecrement}
        onClick={handleDecrement}
        aria-label="Decrease hours"
        tabIndex={-1}
      >
        <Minus className="h-3 w-3" />
      </Button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          aria-label="Enter hours"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleInputKeyDown}
          className="h-7 w-14 rounded-sm bg-transparent text-center text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      ) : (
        <span
          role="status"
          aria-live="polite"
          onClick={enterEditMode}
          className="flex h-7 w-14 cursor-pointer select-none items-center justify-center rounded-sm text-sm font-medium hover:bg-accent"
        >
          {String(parseFloat(value.toFixed(2)))}h
        </span>
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7 shrink-0"
        disabled={disabled || !canIncrement}
        onClick={handleIncrement}
        aria-label="Increase hours"
        tabIndex={-1}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
