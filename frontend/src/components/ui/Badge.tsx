// Reusable Badge component for status markers, confidence scores, and roles.
// Supports status colors with optional pulsing animations.

import React from 'react';
import { cn } from '@/lib/classNames';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'amber' | 'cyan' | 'green' | 'red' | 'purple' | 'outline';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  pulse = false,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  }[size];

  const variantClasses = {
    default: 'bg-forge-surface-elevated text-gray-300 border border-forge-border',
    amber: 'bg-forge-amber/15 text-forge-amber-light border border-forge-amber/30',
    cyan: 'bg-forge-cyan/15 text-forge-cyan-light border border-forge-cyan/30',
    green: 'bg-forge-green/15 text-forge-green-light border border-forge-green/30',
    red: 'bg-forge-red/15 text-forge-red-light border border-forge-red/30',
    purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    outline: 'bg-transparent text-gray-300 border border-forge-border',
  }[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider',
        sizeClasses,
        variantClasses,
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {pulse && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-ping',
            variant === 'amber' && 'bg-forge-amber',
            variant === 'green' && 'bg-forge-green',
            variant === 'red' && 'bg-forge-red',
            variant === 'cyan' && 'bg-forge-cyan',
            variant === 'default' && 'bg-gray-400'
          )}
        />
      )}
      {children}
    </span>
  );
};
