// Result bar summarizing duration and AI queries consumed by the remediation.
// Features a distinct glowing style for instant zero-AI memory fixes.

import React from 'react';
import { Clock, Zap, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/classNames';

export interface ResultBarProps {
  durationSeconds: number;
  aiCalls: number;
  healedFromMemory: boolean;
  className?: string;
}

export const ResultBar: React.FC<ResultBarProps> = ({
  durationSeconds,
  aiCalls,
  healedFromMemory,
  className,
}) => {
  if (healedFromMemory) {
    return (
      <div
        className={cn(
          'p-4 rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-950/30 via-forge-surface to-purple-950/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-purple-900/20 animate-fadeIn',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/50 flex items-center justify-center text-purple-300">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-purple-300 font-bold block">
              Instant Fix from Memory (No AI needed)
            </span>
            <p className="text-sm font-bold text-white">
              Fixed in ~{durationSeconds || 5}s using 0 AI calls (remembered from last time)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-black/40 border border-purple-500/40 px-3 py-1.5 rounded-lg text-purple-200">
          <Zap className="w-3.5 h-3.5 text-forge-amber" />
          <span>100% compute saved</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-forge-amber/30 bg-forge-surface flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-fadeIn',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-forge-amber/15 border border-forge-amber/30 flex items-center justify-center text-forge-amber">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-forge-amber-light font-bold block">
            Self-Healing Complete
          </span>
          <p className="text-sm font-bold text-white">
            Fixed in ~{durationSeconds || 22}s using {aiCalls} AI calls
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          Duration: ~{durationSeconds || 22}s
        </span>
        <span className="flex items-center gap-1 text-gray-300">
          <Zap className="w-3.5 h-3.5 text-forge-amber" />
          {aiCalls} AI calls
        </span>
      </div>
    </div>
  );
};
