// The Live Demo Stage (Home Page) for DriftSmith.
// Presents a clear, 10-second understandable narrative for judges without technical jargon.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { Scenario } from '@/api/types';
import { useRuns } from '@/hooks/useRuns';
import { useRun } from '@/hooks/useRun';
import { useRunEvents } from '@/hooks/useRunEvents';
import { useTriggerDrift } from '@/hooks/useTriggerDrift';
import { useApprove } from '@/hooks/useApprove';
import { usePatterns } from '@/hooks/usePatterns';
import { useToast } from '@/components/ui/Toast';
import { ChoiceCard } from '@/components/demo/ChoiceCard';
import { RemediationStage } from '@/components/runs/RemediationStage';
import { PresenterOverlay, PRESENTER_STEPS } from '@/components/demo/PresenterOverlay';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TermHint } from '@/components/ui/TermHint';
import { formatRelativeTime } from '@/lib/formatDate';
import { DRIFT_SCENARIOS } from '@/mock/drifts';

export const DashboardPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('type');
  const [selectedApp, setSelectedApp] = useState<'Payment app' | 'Second payment app (has seen this problem before)'>('Payment app');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  // Presenter Mode state
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [presenterStepIndex, setPresenterStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2>(1);

  const { data: runs = [], refetch: refetchRuns } = useRuns();
  const { data: patterns = [] } = usePatterns();
  const triggerMutation = useTriggerDrift();
  const approveMutation = useApprove();
  const { toast } = useToast();

  // Active run details
  const { data: activeRun, refetch: refetchActiveRun } = useRun(activeRunId || undefined);

  const isCompletedInitially =
    activeRun?.status === 'approved' ||
    activeRun?.status === 'awaiting_approval' ||
    activeRun?.status === 'failed';

  const { events, isStreaming, isFinished } = useRunEvents(
    activeRunId || undefined,
    isCompletedInitially
  );

  // Check if chosen scenario has a remembered fix
  const scenarioData = DRIFT_SCENARIOS[selectedScenario];
  const hasRememberedFix = patterns.some(
    (p) => p.fingerprint === scenarioData?.driftReport?.fingerprint
  );
  const willHealFromMemory =
    selectedApp === 'Second payment app (has seen this problem before)' && hasRememberedFix;

  const handleSimulate = useCallback(
    async (
      overrideScenario?: Scenario,
      overrideApp?: 'Payment app' | 'Second payment app (has seen this problem before)'
    ) => {
      const scenarioToRun = overrideScenario || selectedScenario;
      const appToRun = overrideApp || selectedApp;

      try {
        const res = await triggerMutation.mutateAsync({
          scenario: scenarioToRun,
          service_name: appToRun,
        });

        setActiveRunId(res.run_id);

        if (appToRun.includes('Second') && hasRememberedFix) {
          toast('Instant fix from memory: DriftSmith solved this with 0 AI calls!', 'success');
        } else {
          toast('API change simulated. DriftSmith is repairing the code...', 'info');
        }
      } catch {
        toast('Failed to start simulation', 'error');
      }
    },
    [selectedScenario, selectedApp, triggerMutation, hasRememberedFix, toast]
  );

  const handleApprove = useCallback(async () => {
    if (!activeRunId) return;
    try {
      await approveMutation.mutateAsync(activeRunId);
      toast('Fix approved! Pull request preview is ready for your team.', 'success');
      refetchActiveRun();
      refetchRuns();
    } catch {
      toast('Could not approve fix. Please try again.', 'error');
    }
  }, [activeRunId, approveMutation, toast, refetchActiveRun, refetchRuns]);

  // Automated Presenter Mode Driver
  useEffect(() => {
    if (!isPresenterMode || !isPlaying) return;

    const baseDelay = (ms: number) => ms / speed;
    let timer: ReturnType<typeof setTimeout>;

    switch (presenterStepIndex) {
      case 0:
        // Intro: Priya's payment app
        timer = setTimeout(() => {
          setPresenterStepIndex(1);
        }, baseDelay(6000));
        break;

      case 1:
        // API changed: trigger type scenario on Payment app
        setSelectedScenario('type');
        setSelectedApp('Payment app');
        handleSimulate('type', 'Payment app');
        timer = setTimeout(() => {
          setPresenterStepIndex(2);
        }, baseDelay(4000));
        break;

      case 2:
        // Drift detected
        timer = setTimeout(() => {
          setPresenterStepIndex(3);
        }, baseDelay(5000));
        break;

      case 3:
        // Code written & Reviewer caught bug
        timer = setTimeout(() => {
          setPresenterStepIndex(4);
        }, baseDelay(6000));
        break;

      case 4:
        // Safe test room passed
        timer = setTimeout(() => {
          setPresenterStepIndex(5);
        }, baseDelay(6000));
        break;

      case 5:
        // Human approval step: wait and auto-approve
        timer = setTimeout(async () => {
          if (activeRunId) {
            await handleApprove();
          }
          setPresenterStepIndex(6);
        }, baseDelay(5000));
        break;

      case 6:
        // Second app hits the exact same problem -> Memory heal!
        setSelectedApp('Second payment app (has seen this problem before)');
        handleSimulate('type', 'Second payment app (has seen this problem before)');
        timer = setTimeout(() => {
          setPresenterStepIndex(7);
        }, baseDelay(6500));
        break;

      case 7:
        // Final summary card
        break;
    }

    return () => clearTimeout(timer);
  }, [isPresenterMode, presenterStepIndex, isPlaying, speed, activeRunId, handleSimulate, handleApprove]);

  const startGuidedDemo = () => {
    setIsPresenterMode(true);
    setPresenterStepIndex(0);
    setIsPlaying(true);
  };

  const recentRuns = runs.slice(0, 5);

  return (
    <div className="max-w-[1100px] mx-auto space-y-10 py-2">
      {/* 1. Header Explainer Strip */}
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
            variant="primary"
            size="lg"
            onClick={startGuidedDemo}
            leftIcon={<Play className="w-5 h-5 text-black fill-black" />}
            className="font-bold text-sm tracking-wide px-6 py-3.5 shadow-amber-glow flex-shrink-0 w-full md:w-auto"
          >
            Start guided demo
          </Button>
        </div>
      </div>

      {/* 2. Step 1: Break Something (Choice Card Grid) */}
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
            onSelect={() => setSelectedScenario('type')}
          />

          <ChoiceCard
            id="rename"
            title="Field renamed"
            technicalLabel="key renamed"
            description="Provider renamed amount_in_cents to total_amount. Your code looks for the old key and gets undefined."
            beforeSnippet="amount_in_cents"
            afterSnippet="total_amount"
            isSelected={selectedScenario === 'rename'}
            onSelect={() => setSelectedScenario('rename')}
          />

          <ChoiceCard
            id="nested"
            title="Email moved"
            technicalLabel="object restructure"
            description="Customer email moved from top-level customer.email to deeply nested payer.contact.email."
            beforeSnippet="customer.email"
            afterSnippet="payer.contact.email"
            isSelected={selectedScenario === 'nested'}
            onSelect={() => setSelectedScenario('nested')}
          />
        </div>

        {/* Target App Selection */}
        <div className="pt-2 border-t border-forge-border/80 space-y-3">
          <label className="text-xs font-mono uppercase tracking-wider text-gray-400 block font-semibold">
            Which app should receive this data?
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedApp('Payment app')}
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
              onClick={() => setSelectedApp('Second payment app (has seen this problem before)')}
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
            onClick={() => handleSimulate()}
            isLoading={triggerMutation.isPending}
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

      {/* 3. The Stage: Appears after clicking on the same page */}
      {activeRun && (
        <div className="space-y-6 pt-4 border-t border-forge-border/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Live Remediation Stage</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 text-gray-300 border border-forge-border">
                  {activeRun.id}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Watching DriftSmith diagnose and safely patch {activeRun.service_name}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchActiveRun()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-mono"
            >
              Refresh Stage
            </Button>
          </div>

          <RemediationStage
            run={activeRun}
            events={events}
            isStreaming={isStreaming}
            isFinished={isFinished}
            onApprove={handleApprove}
            isApproving={approveMutation.isPending}
          />
        </div>
      )}

      {/* 4. Recent Fixes Table (Simple 5 rows) */}
      <div className="rounded-2xl border border-forge-border bg-forge-surface p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-forge-border">
          <div>
            <h3 className="text-base font-bold text-white">Recent fixes</h3>
            <p className="text-xs text-gray-400">Past autonomous repairs verified in safe test room</p>
          </div>

          <Link
            to="/history"
            className="text-xs font-mono text-forge-amber hover:underline flex items-center gap-1 font-semibold"
          >
            <span>View all history</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="text-gray-400 font-mono text-[11px] uppercase border-b border-forge-border/60 pb-2">
                <th className="py-2.5 px-3">When</th>
                <th className="py-2.5 px-3">What changed</th>
                <th className="py-2.5 px-3">App</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forge-border/40 font-mono">
              {recentRuns.map((r) => {
                const sc = DRIFT_SCENARIOS[r.scenario];
                return (
                  <tr
                    key={r.id}
                    onClick={() => setActiveRunId(r.id)}
                    className="hover:bg-forge-surface-elevated/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 text-gray-400 whitespace-nowrap">
                      {formatRelativeTime(r.started_at)}
                    </td>
                    <td className="py-3 px-3 text-white font-sans font-semibold group-hover:text-forge-amber-light">
                      {sc?.title || r.scenario}
                    </td>
                    <td className="py-3 px-3 text-gray-300 font-sans">{r.service_name}</td>
                    <td className="py-3 px-3 text-gray-300">
                      {r.healed_from_memory ? (
                        <span className="text-purple-300 font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-forge-amber" />
                          Instant (0 AI calls)
                        </span>
                      ) : (
                        <span>Fixed ({r.llm_calls} AI calls)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Badge
                        variant={
                          r.status === 'approved'
                            ? 'green'
                            : r.status === 'awaiting_approval'
                            ? 'amber'
                            : r.status === 'failed'
                            ? 'red'
                            : 'cyan'
                        }
                        size="sm"
                      >
                        {r.status === 'awaiting_approval'
                          ? 'Ready for approval'
                          : r.status === 'approved'
                          ? 'Approved'
                          : r.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Presenter Mode Guided Walkthrough Overlay */}
      {isPresenterMode && (
        <PresenterOverlay
          currentStepIndex={presenterStepIndex}
          isPlaying={isPlaying}
          speed={speed}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onNext={() => setPresenterStepIndex((prev) => Math.min(prev + 1, PRESENTER_STEPS.length - 1))}
          onPrev={() => setPresenterStepIndex((prev) => Math.max(prev - 1, 0))}
          onToggleSpeed={() => setSpeed((prev) => (prev === 1 ? 2 : 1))}
          onExit={() => setIsPresenterMode(false)}
        />
      )}
    </div>
  );
};
