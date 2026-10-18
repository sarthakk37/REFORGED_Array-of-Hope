// Empty state placeholder for tables, timelines, and lists.
// Informs users when no data exists and provides optional action triggers.

import React from 'react';
import { cn } from '@/lib/classNames';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-forge-border bg-forge-surface/50',
        className
      )}
    >
      {icon && (
        <div className="p-3 mb-4 rounded-full bg-forge-surface-elevated text-gray-400 border border-forge-border">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-200 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
