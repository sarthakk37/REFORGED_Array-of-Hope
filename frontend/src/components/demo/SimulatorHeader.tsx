// Top headline banner explaining DriftSmith in 10 seconds for judges.
// Displays the one-line product value proposition and the guided demo trigger button.

import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TermHint } from '@/components/ui/TermHint';

export interface SimulatorHeaderProps {
  onStartGuidedDemo: () => void;
}

export const SimulatorHeader: React.FC<SimulatorHeaderProps> = ({
  onStartGuidedDemo,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-6 rounded-2xl border border-forge-border bg-gradient-to-r from-forge-surface via-forge-surface-elevated to-forge-surface shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
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

        <Button
          data-testid="start-guided-demo-btn"
          variant="primary"
          size="lg"
          onClick={onStartGuidedDemo}
          leftIcon={<Play className="w-5 h-5 text-black fill-black" />}
          className="font-bold text-sm tracking-wide px-6 py-3.5 shadow-amber-glow flex-shrink-0 w-full md:w-auto"
        >
          Start guided demo
        </Button>
      </div>
    </div>
  );
};
