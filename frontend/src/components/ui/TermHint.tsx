// Small helper tooltip component for technical terms.
// Shows a subtle '?' icon that reveals a plain-English explanation on hover.

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/classNames';

export interface TermHintProps {
  term: string;
  explanation: string;
  className?: string;
}

export const TermHint: React.FC<TermHintProps> = ({ term, explanation, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className={cn('relative inline-flex items-center gap-1 group cursor-help', className)}>
      <span>{term}</span>
      <button
        type="button"
        aria-label={`Explanation for ${term}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-forge-amber transition-colors focus:outline-none"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-forge-surface-elevated text-gray-200 text-xs rounded-lg border border-forge-border shadow-xl z-50 text-left normal-case tracking-normal font-sans pointer-events-none animate-fadeIn">
          {explanation}
        </span>
      )}
    </span>
  );
};
