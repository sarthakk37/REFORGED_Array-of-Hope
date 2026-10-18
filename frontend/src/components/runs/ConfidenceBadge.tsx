// Badge displaying confidence score percentage with dynamic thresholds.
// Highlights high confidence in green, moderate in amber, and low in red.

import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/classNames';

export interface ConfidenceBadgeProps {
  confidence: number | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  size = 'md',
  className,
}) => {
  if (confidence === null || confidence === undefined) {
    return (
      <span className="text-xs text-gray-500 font-mono italic">
        No confidence score
      </span>
    );
  }

  const percentage = Math.round(confidence * 100);

  let variantClasses = 'bg-forge-green/15 text-forge-green-light border-forge-green/30';
  let Icon = ShieldCheck;

  if (percentage < 70) {
    variantClasses = 'bg-forge-red/15 text-forge-red-light border-forge-red/30';
    Icon = AlertCircle;
  } else if (percentage < 90) {
    variantClasses = 'bg-forge-amber/15 text-forge-amber-light border-forge-amber/30';
    Icon = AlertCircle;
  }

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-mono font-semibold tracking-wide select-none',
        variantClasses,
        sizeClasses,
        className
      )}
      title={`Remediation Confidence Score: ${percentage}%`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{percentage}% CONFIDENCE</span>
    </div>
  );
};
