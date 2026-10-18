// Minimal loading spinner styled to match the dark forge theme.
// Used for inline loading, buttons, and section skeleton fallbacks.

import React from 'react';
import { cn } from '@/lib/classNames';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'amber' | 'cyan' | 'white';
}

export const Spinner: React.FC<SpinnerProps> = ({
  className,
  size = 'md',
  variant = 'amber',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  }[size];

  const colorClasses = {
    amber: 'border-forge-border border-t-forge-amber',
    cyan: 'border-forge-border border-t-forge-cyan',
    white: 'border-white/20 border-t-white',
  }[variant];

  return (
    <div
      className={cn('inline-block rounded-full animate-spin', sizeClasses, colorClasses, className)}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
};
