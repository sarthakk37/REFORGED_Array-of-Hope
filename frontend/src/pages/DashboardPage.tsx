// The Live Demo Stage (Home Page) for DriftSmith.
// Coordinates simulator controls, real-time remediation stage, and automated presenter walkthrough.

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Scenario } from '@/api/types';
import { useRuns } from '@/hooks/useRuns';
import { useRun } from '@/hooks/useRun';
import { useRunEvents } from '@/hooks/useRunEvents';
import { useTriggerDrift } from '@/hooks/useTriggerDrift';
import { useApprove } from '@/hooks/useApprove';
import { usePatterns } from '@/hooks/usePatterns';
import { useToast } from '@/components/ui/Toast';
import { RemediationStage } from '@/components/runs/RemediationStage';
import { PresenterOverlay, PRESENTER_STEPS } from '@/components/demo/PresenterOverlay';
import { SimulatorHeader } from '@/components/demo/SimulatorHeader';
import { SimulatorControls, AppTarget } from '@/components/demo/SimulatorControls';
import { RecentRunsTable } from '@/components/demo/RecentRunsTable';
import { Button } from '@/components/ui/Button';
import { DRIFT_SCENARIOS } from '@/mock/drifts';

export const DashboardPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('type');
  const [selectedApp, setSelectedApp] = useState<AppTarget>('Payment app');
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
      overrideApp?: AppTarget
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
        timer = setTimeout(() => setPresenterStepIndex(1), baseDelay(6000));
        break;
      case 1:
        setSelectedScenario('type');
        setSelectedApp('Payment app');
        handleSimulate('type', 'Payment app');
        timer = setTimeout(() => setPresenterStepIndex(2), baseDelay(8000));
        break;
      case 2:
      case 3:
      case 4:
        timer = setTimeout(() => setPresenterStepIndex((i) => i + 1), baseDelay(6000));
        break;
      case 5:
        if (activeRunId) handleApprove();
        timer = setTimeout(() => setPresenterStepIndex(6), baseDelay(7000));
        break;
      case 6:
        setSelectedScenario('type');
        setSelectedApp('Second payment app (has seen this problem before)');
        handleSimulate('type', 'Second payment app (has seen this problem before)');
        timer = setTimeout(() => setPresenterStepIndex(7), baseDelay(6000));
        break;
      case 7:
        break;
      default:
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
      <SimulatorHeader onStartGuidedDemo={startGuidedDemo} />

      <SimulatorControls
        selectedScenario={selectedScenario}
        onSelectScenario={setSelectedScenario}
        selectedApp={selectedApp}
        onSelectApp={setSelectedApp}
        hasRememberedFix={hasRememberedFix}
        willHealFromMemory={willHealFromMemory}
        isTriggering={triggerMutation.isPending}
        onSimulate={() => handleSimulate()}
      />

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
              onClick={() => {
                refetchActiveRun();
                refetchRuns();
              }}
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

      <RecentRunsTable runs={recentRuns} onSelectRun={setActiveRunId} />

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
