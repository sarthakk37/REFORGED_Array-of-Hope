// Reusable Card container for dashboards, metrics, and panels.
// Provides consistent background, borders, and paddings for the forge theme.

import React from 'react';
import { cn } from '@/lib/classNames';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  glow?: 'none' | 'amber' | 'cyan' | 'green' | 'red';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  elevated = false,
  glow = 'none',
  ...props
}) => {
  const glowClasses = {
    none: '',
    amber: 'border-forge-amber/40 shadow-amber-glow',
    cyan: 'border-forge-cyan/40 shadow-cyan-glow',
    green: 'border-forge-green/40 shadow-green-glow',
    red: 'border-forge-red/40 shadow-red-glow',
  }[glow];

  return (
    <div
      className={cn(
        'rounded-lg border border-forge-border transition-colors duration-150',
        elevated ? 'bg-forge-surface-elevated' : 'bg-forge-surface',
        glowClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn('px-5 py-4 border-b border-forge-border flex items-center justify-between', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5', className)} {...props}>
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn('px-5 py-3 border-t border-forge-border bg-black/20 flex items-center', className)}
    {...props}
  >
    {children}
  </div>
);
