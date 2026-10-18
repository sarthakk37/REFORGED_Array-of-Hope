// Large selectable choice card for picking API breakage scenarios.
// Displays before -> after snippet and plain-English description.

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/classNames';

export interface ChoiceCardProps {
  id: string;
  title: string;
  technicalLabel: string;
  description: string;
  beforeSnippet: string;
  afterSnippet: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const ChoiceCard: React.FC<ChoiceCardProps> = ({
  id,
  title,
  technicalLabel,
  description,
  beforeSnippet,
  afterSnippet,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`simulator-choice-${id}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'p-5 rounded-xl border text-left cursor-pointer transition-all duration-200 relative group flex flex-col justify-between space-y-4',
        isSelected
          ? 'bg-forge-amber/10 border-forge-amber shadow-amber-glow/50 ring-1 ring-forge-amber'
          : 'bg-forge-surface border-forge-border hover:border-gray-500 hover:bg-forge-surface-elevated'
      )}
    >
      <div>
        {/* Header with Title and Technical tag */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className={cn('text-base font-bold', isSelected ? 'text-white' : 'text-gray-200')}>
              {title}
            </h3>
            <span className="text-[11px] font-mono text-gray-500 block mt-0.5">
              {technicalLabel}
            </span>
          </div>

          <div
            className={cn(
              'w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors',
              isSelected
                ? 'bg-forge-amber text-black border-forge-amber'
                : 'border-forge-border bg-black/40 group-hover:border-gray-400'
            )}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed font-sans">{description}</p>
      </div>

      {/* Before -> After mini snippet */}
      <div className="p-3 rounded-lg bg-black/50 border border-forge-border/80 font-mono text-xs space-y-1">
        <div className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">
          What changed:
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/30">
            {beforeSnippet}
          </span>
          <ArrowRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
          <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30">
            {afterSnippet}
          </span>
        </div>
      </div>
    </div>
  );
};
