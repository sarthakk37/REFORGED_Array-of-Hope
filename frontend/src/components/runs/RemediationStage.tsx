// The central Live Demo Stage presenting the 5-step self-healing remediation flow.
// Composes StoryProgress, BeforeAfterPayload, PlainLog, FixDiff, SafeTestResults, ResultBar, and ApprovalPanel.

import React from 'react';
import { RunDetail, RunEvent } from '@/api/types';
import { DRIFT_SCENARIOS } from '@/mock/drifts';
import { StoryProgress } from './StoryProgress';
import { BeforeAfterPayload } from './BeforeAfterPayload';
import { PlainLog } from './PlainLog';
import { FixDiff } from './FixDiff';
import { SafeTestResults } from './SafeTestResults';
import { ResultBar } from './ResultBar';
import { ApprovalPanel } from './ApprovalPanel';

export interface RemediationStageProps {
  run: RunDetail;
  events: RunEvent[];
  isStreaming: boolean;
  isFinished: boolean;
  onApprove: () => Promise<void>;
  isApproving?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const RemediationStage: React.FC<RemediationStageProps> = ({
  run,
  events,
  isStreaming,
  isFinished,
  onApprove,
  isApproving = false,
  error = null,
  onRetry,
}) => {
  const scenarioData = DRIFT_SCENARIOS[run.scenario] || DRIFT_SCENARIOS.type;

  // Derive current story step from events or run status
  const lastEvent = events[events.length - 1];
  const isRetrying = Boolean(lastEvent?.payload?.isRetry);

  let currentStep = (lastEvent?.payload?.storyStep as number) || 1;
  if (run.status === 'awaiting_approval' || run.status === 'approved' || isFinished) {
    currentStep = 5;
  }

  // Calculate duration in seconds
  let durationSec = run.healed_from_memory ? 5 : 22;
  if (run.started_at && run.finished_at) {
    const start = new Date(run.started_at).getTime();
    const end = new Date(run.finished_at).getTime();
    durationSec = Math.max(1, Math.round((end - start) / 1000));
  }

  return (
    <div data-testid="remediation-stage" className="space-y-6 animate-fadeIn">
      {/* 5-Step Narrative Progress Bar */}
      <StoryProgress
        currentStep={currentStep}
        isFinished={run.status === 'approved' || run.status === 'awaiting_approval' || isFinished}
        isRetrying={isRetrying}
      />

      {/* Grid: What Changed (Before/After) + Plain Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BeforeAfterPayload
          title={scenarioData.title}
          plainCaption={scenarioData.plainCaption}
          oldPayloadJson={scenarioData.oldPayloadJson}
          newPayloadJson={scenarioData.newPayloadJson}
        />

        <PlainLog
          events={events}
          isStreaming={isStreaming}
          isFinished={run.status === 'awaiting_approval' || run.status === 'approved' || isFinished}
        />
      </div>

      {/* The Code Fix Diff */}
      {run.patch && (
        <FixDiff
          patch={run.patch}
          plainCaption={scenarioData.diffPlainCaption}
        />
      )}

      {/* Safe Test Results */}
      {(run.patch || isFinished || run.status !== 'running') && (
        <SafeTestResults
          sandboxLog={run.patch?.sandbox_log}
          scenarioTitle={scenarioData.title}
        />
      )}

      {/* Duration and AI Compute Metric Bar */}
      {(isFinished || run.status === 'awaiting_approval' || run.status === 'approved') && (
        <ResultBar
          durationSeconds={durationSec}
          aiCalls={run.llm_calls}
          healedFromMemory={run.healed_from_memory}
        />
      )}

      {/* Approval & Pull Request Preview Panel */}
      <ApprovalPanel
        run={run}
        onApprove={onApprove}
        isApproving={isApproving}
        error={error}
        onRetry={onRetry}
      />
    </div>
  );
};
