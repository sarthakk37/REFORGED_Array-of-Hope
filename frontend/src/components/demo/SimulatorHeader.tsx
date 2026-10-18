// Top headline banner explaining DriftSmith in 10 seconds.
// Displays the one-line product value proposition and plain-English terminology hint.

import React from 'react';
import { TermHint } from '@/components/ui/TermHint';

export const SimulatorHeader: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="p-6 rounded-2xl border border-forge-border bg-gradient-to-r from-forge-surface via-forge-surface-elevated to-forge-surface shadow-xl">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-forge-amber font-bold">
              Self-Healing Code Agent
            </span>
            <TermHint
              term="API change"
              explanation="Third-party payment or SaaS providers often alter their response fields without warning, breaking your app."
            />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
            When a company's API changes without warning, DriftSmith fixes your code automatically, tests the fix, and asks you to approve.
          </p>
        </div>
      </div>
    </div>
  );
};
