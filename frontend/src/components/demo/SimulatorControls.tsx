// Interactive Breakage Simulator card containing the 3 ChoiceCards, app selector, and simulate action.
// Enables judges and operators to simulate realistic API drift scenarios.

import React from 'react';
import { Zap } from 'lucide-react';
import { Scenario } from '@/api/types';
import { ChoiceCard } from './ChoiceCard';
import { Button } from '@/components/ui/Button';

export type AppTarget = 'Payment app' | 'Second payment app (has seen this problem before)';

export interface SimulatorControlsProps {
  selectedScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  selectedApp: AppTarget;
  onSelectApp: (app: AppTarget) => void;
  hasRememberedFix: boolean;
  willHealFromMemory: boolean;
  isTriggering: boolean;
  onSimulate: () => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  selectedScenario,
  onSelectScenario,
  selectedApp,
  onSelectApp,
  hasRememberedFix,
  willHealFromMemory,
  isTriggering,
  onSimulate,
}) => {
  return (
    <div className="rounded-2xl border border-forge-border bg-forge-surface p-6 sm:p-8 shadow-xl space-y-6">
      <div className="border-b border-forge-border/80 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Step 1: Choose an API change to simulate
          </h2>
          <span className="text-xs font-mono text-gray-400">Interactive Simulator</span>
        </div>
        <p className="text-xs text-gray-300 mt-1">
          Pick a realistic breakage from an external payment provider, then see how DriftSmith fixes it in seconds.
        </p>
      </div>

      {/* The 3 Big Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChoiceCard
          id="type"
          title="Price format changed"
          technicalLabel="type mismatch"
          description="Provider sends amount as a string decimal rupees ('499.00') instead of integer paise (49900)."
          beforeSnippet="amount: 49900"
          afterSnippet='amount: "499.00"'
          isSelected={selectedScenario === 'type'}
          onSelect={() => onSelectScenario('type')}
        />

        <ChoiceCard
          id="rename"
          title="Field renamed"
          technicalLabel="key renamed"
          description="Provider renamed amount_in_cents to total_amount. Your code looks for the old key and gets undefined."
          beforeSnippet="amount_in_cents"
          afterSnippet="total_amount"
          isSelected={selectedScenario === 'rename'}
          onSelect={() => onSelectScenario('rename')}
        />

        <ChoiceCard
          id="nested"
          title="Email moved"
          technicalLabel="object restructure"
          description="Customer email moved from top-level customer.email to deeply nested payer.contact.email."
          beforeSnippet="customer.email"
          afterSnippet="payer.contact.email"
          isSelected={selectedScenario === 'nested'}
          onSelect={() => onSelectScenario('nested')}
        />
      </div>

      {/* App Selector */}
      <div className="pt-2 space-y-3">
        <label className="text-xs font-mono uppercase tracking-wider text-gray-400 block font-semibold">
          Select target application:
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelectApp('Payment app')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedApp === 'Payment app'
                ? 'bg-forge-amber/10 border-forge-amber ring-1 ring-forge-amber'
                : 'bg-forge-bg border-forge-border hover:border-gray-500'
            }`}
          >
            <div className="text-sm font-bold text-white">Payment app</div>
            <div className="text-xs text-gray-400 mt-0.5">
              Full repair loop: investigates, writes fix, reviews, and tests (~22s)
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectApp('Second payment app (has seen this problem before)')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedApp === 'Second payment app (has seen this problem before)'
                ? 'bg-purple-950/30 border-purple-500 ring-1 ring-purple-500'
                : 'bg-forge-bg border-forge-border hover:border-gray-500'
            }`}
          >
            <div className="text-sm font-bold text-purple-200 flex items-center justify-between">
              <span>Second payment app</span>
              {hasRememberedFix && (
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">
                  Fix remembered!
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {hasRememberedFix
                ? 'Instant fix from memory: 0 AI calls, solved in ~5s'
                : 'Will run full repair loop since no fix is remembered yet'}
            </div>
          </button>
        </div>
      </div>

      {/* Trigger Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-gray-400">
          {willHealFromMemory ? (
            <span className="flex items-center gap-1.5 text-purple-300 font-mono">
              <Zap className="w-4 h-4 text-forge-amber" />
              DriftSmith has seen this before. Instant memory heal will be triggered!
            </span>
          ) : (
            <span>Safe sandbox testing will verify old and new data compatibility.</span>
          )}
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onSimulate}
          isLoading={isTriggering}
          className={`font-bold text-xs uppercase tracking-wider px-8 py-3.5 w-full sm:w-auto ${
            willHealFromMemory ? 'bg-purple-600 hover:bg-purple-500 shadow-lg text-white' : ''
          }`}
        >
          {willHealFromMemory
            ? 'Simulate API change (instant fix expected)'
            : 'Simulate API change'}
        </Button>
      </div>
    </div>
  );
};
