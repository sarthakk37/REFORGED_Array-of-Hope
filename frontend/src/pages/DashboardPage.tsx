// The Live Demo Stage (Home Page) for DriftSmith.
// Coordinates simulator controls, real-time remediation stage, and synchronized voice walkthrough.

import React, { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Scenario } from '@/api/types';
import { useRuns } from '@/hooks/useRuns';
import { useRun } from '@/hooks/useRun';
import { useRunEvents } from '@/hooks/useRunEvents';
import { useTriggerDrift } from '@/hooks/useTriggerDrift';
import { useApprove } from '@/hooks/useApprove';
import { usePatterns } from '@/hooks/usePatterns';
import { useToast } from '@/components/ui/Toast';
import { usePresenterDriver } from '@/hooks/usePresenterDriver';
import { RemediationStage } from '@/components/runs/RemediationStage';
import { PresenterOverlay } from '@/components/demo/PresenterOverlay';
import { SimulatorHeader } from '@/components/demo/SimulatorHeader';
import { SimulatorControls, AppTarget } from '@/components/demo/SimulatorControls';
import { RecentRunsTable } from '@/components/demo/RecentRunsTable';
import { Button } from '@/components/ui/Button';
import { DRIFT_SCENARIOS } from '@/mock/drifts';

export const DashboardPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('type');
  const [selectedApp, setSelectedApp] = useState<AppTarget>('Payment app');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const { data: runs = [], refetch: refetchRuns } = useRuns();
  const { data: patterns = [] } = usePatterns();
  const triggerMutation = useTriggerDrift();
  const approveMutation = useApprove();
  const { toast } = useToast();

  const { data: activeRun, refetch: refetchActiveRun } = useRun(activeRunId || undefined);

  const isCompletedInitially =
    activeRun?.status === 'approved' ||
    activeRun?.status === 'awaiting_approval' ||
    activeRun?.status === 'failed';

  const { events, isStreaming, isFinished } = useRunEvents(
    activeRunId || undefined,
    isCompletedInitially
  );

  const scenarioData = DRIFT_SCENARIOS[selectedScenario];
  const hasRememberedFix = patterns.some(
    (p) => p.fingerprint === scenarioData?.driftReport?.fingerprint
  );
  const willHealFromMemory =
    selectedApp === 'Second payment app (has seen this problem before)' && hasRememberedFix;

  const handleSimulate = useCallback(
    async (overrideScenario?: Scenario, overrideApp?: AppTarget) => {
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

  // Hook driving automated presenter walkthrough and spoken narration
  const presenter = usePresenterDriver({
    activeRunId,
    onSimulate: handleSimulate,
    onApprove: handleApprove,
    onSelectScenario: setSelectedScenario,
    onSelectApp: setSelectedApp,
  });

  const recentRuns = runs.slice(0, 5);

  return (
    <div className="max-w-[1100px] mx-auto space-y-10 py-2">
      <SimulatorHeader onStartGuidedDemo={presenter.startGuidedDemo} />

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

      {presenter.isPresenterMode && (
        <PresenterOverlay
          currentStepIndex={presenter.presenterStepIndex}
          isPlaying={presenter.isPlaying}
          speed={presenter.speed}
          isMuted={presenter.narration.isMuted}
          volume={presenter.narration.volume}
          availableVoices={presenter.narration.availableVoices}
          selectedVoice={presenter.narration.selectedVoice}
          onTogglePlay={presenter.handleTogglePlay}
          onNext={presenter.handleNextStep}
          onPrev={presenter.handlePrevStep}
          onToggleSpeed={() => presenter.setSpeed((prev) => (prev === 1 ? 2 : 1))}
          onToggleMute={() => presenter.narration.setMuted(!presenter.narration.isMuted)}
          onVolumeChange={presenter.narration.setVolume}
          onVoiceChange={presenter.narration.setVoice}
          onExit={presenter.handleExitDemo}
        />
      )}
    </div>
  );
};
