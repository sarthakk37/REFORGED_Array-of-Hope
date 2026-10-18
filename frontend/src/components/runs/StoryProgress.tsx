// Horizontal 5-step progress bar showing the user-friendly DriftSmith narrative.
// Glows and pulses on active steps, marks completed steps, and highlights retries in amber.

import React from 'react';
import { Check, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/classNames';

export interface StoryProgressProps {
  currentStep: number; // 1 to 5
  isFinished: boolean;
  isRetrying?: boolean;
  className?: string;
}

export const StoryProgress: React.FC<StoryProgressProps> = ({
  currentStep,
  isFinished,
  isRetrying = false,
  className,
}) => {
  const steps = [
    { number: 1, label: 'API changed' },
    { number: 2, label: 'Problem found' },
    { number: 3, label: 'Fix written' },
    { number: 4, label: 'Fix tested' },
    { number: 5, label: 'Ready for your approval' },
  ];

  return (
    <div className={cn('p-5 rounded-xl border border-forge-border bg-forge-surface/90', className)}>
      <div className="flex items-center justify-between relative">
        {/* Connecting Progress Line */}
        <div className="absolute left-6 right-6 top-4 h-0.5 bg-forge-border -z-0" />
        <div
          className="absolute left-6 top-4 h-0.5 bg-forge-green transition-all duration-500 -z-0"
          style={{
            width: isFinished
              ? 'calc(100% - 3rem)'
              : `calc(${((Math.min(currentStep, 5) - 1) / 4) * 100}% - 1.5rem)`,
          }}
        />

        {steps.map((step) => {
          const isDone = isFinished || currentStep > step.number;
          const isActive = !isFinished && currentStep === step.number;
          const isRetryOnThisStep = isActive && step.number === 4 && isRetrying;

          return (
            <div key={step.number} className="flex flex-col items-center relative z-10 text-center">
              {/* Circle Badge */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 border-2',
                  isDone
                    ? 'bg-forge-green text-black border-forge-green shadow-green-glow'
                    : isRetryOnThisStep
                    ? 'bg-forge-amber text-black border-forge-amber animate-pulse shadow-amber-glow'
                    : isActive
                    ? 'bg-forge-amber text-black border-forge-amber animate-pulse shadow-amber-glow'
                    : 'bg-forge-bg text-gray-400 border-forge-border'
                )}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isRetryOnThisStep ? (
                  <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
                ) : (
                  step.number
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  'text-xs font-medium mt-2 transition-colors max-w-[100px] leading-tight',
                  isDone
                    ? 'text-gray-200'
                    : isRetryOnThisStep
                    ? 'text-forge-amber-light font-bold'
                    : isActive
                    ? 'text-forge-amber-light font-semibold'
                    : 'text-gray-400'
                )}
              >
                {isRetryOnThisStep ? 'Retrying fix...' : step.label}
              </span>

              {isRetryOnThisStep && (
                <span className="flex items-center gap-1 text-[10px] text-forge-amber mt-0.5 font-mono">
                  <AlertCircle className="w-3 h-3" />
                  Reviewer caught bug
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
