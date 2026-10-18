// Badge indicating that the drift was resolved instantly from learned pattern memory.
// Highlights zero LLM call efficiency and instant response time.

import React from 'react';
import { Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/classNames';

export interface MemoryBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const MemoryBadge: React.FC<MemoryBadgeProps> = ({ className, size = 'md' }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-900/20 text-purple-300 font-mono font-semibold tracking-wide shadow-sm',
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        className
      )}
      title="Healed instantly using stored pattern cache with zero LLM queries"
    >
      <Brain className={size === 'sm' ? 'w-3 h-3 text-purple-400' : 'w-3.5 h-3.5 text-purple-400'} />
      <span>HEALED FROM MEMORY</span>
      <span className="text-purple-400 flex items-center gap-0.5 border-l border-purple-500/30 pl-1.5 ml-0.5 text-[10px]">
        <Zap className="w-2.5 h-2.5 text-forge-amber" />
        0 LLM CALLS
      </span>
    </div>
  );
};
