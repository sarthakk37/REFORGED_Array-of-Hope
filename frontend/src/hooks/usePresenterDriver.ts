// Driver hook coordinating presenter mode step progression, visual actions, and voice narration.
// Keeps spoken audio and visual stage animations in strict synchronization.

import { useState, useEffect } from 'react';
import { Scenario } from '@/api/types';
import { PRESENTER_SCRIPT } from '@/demo/script';
import { usePresenterNarration } from './usePresenterNarration';
import { AppTarget } from '@/components/demo/SimulatorControls';

export interface PresenterDriverOptions {
  activeRunId: string | null;
  onSimulate: (scenario: Scenario, app: AppTarget) => Promise<void>;
  onApprove: () => Promise<void>;
  onSelectScenario: (scenario: Scenario) => void;
  onSelectApp: (app: AppTarget) => void;
}

export function usePresenterDriver({
  activeRunId,
  onSimulate,
  onApprove,
  onSelectScenario,
  onSelectApp,
}: PresenterDriverOptions) {
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [presenterStepIndex, setPresenterStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2>(1);

  const narration = usePresenterNarration(speed);

  useEffect(() => {
    if (!isPresenterMode || !isPlaying) return;

    let isCurrent = true;
    const step = PRESENTER_SCRIPT[presenterStepIndex];
    if (!step) return;

    // 1. Dispatch visual actions
    if (step.visualAction === 'trigger-type-payment-app') {
      onSelectScenario('type');
      onSelectApp('Payment app');
      onSimulate('type', 'Payment app');
    } else if (step.visualAction === 'approve-active-run') {
      if (activeRunId) {
        onApprove();
      }
    } else if (step.visualAction === 'trigger-type-second-app') {
      onSelectScenario('type');
      onSelectApp('Second payment app (has seen this problem before)');
      onSimulate('type', 'Second payment app (has seen this problem before)');
    }

    // 2. Visually highlight target element
    if (step.highlightElement && typeof document !== 'undefined') {
      const el = document.querySelector(step.highlightElement);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // 3. Spoken narration finishes before advancing
    narration.speak(step.spokenText, step.stepId).then(() => {
      if (isCurrent && isPlaying && presenterStepIndex < PRESENTER_SCRIPT.length - 1) {
        setPresenterStepIndex((prev) => prev + 1);
      }
    });

    return () => {
      isCurrent = false;
      narration.cancel();
    };
  }, [
    isPresenterMode,
    presenterStepIndex,
    isPlaying,
    speed,
    activeRunId,
    onSimulate,
    onApprove,
    onSelectScenario,
    onSelectApp,
    narration,
  ]);

  const startGuidedDemo = () => {
    setIsPresenterMode(true);
    setPresenterStepIndex(0);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      narration.pause();
    } else {
      setIsPlaying(true);
      narration.resume();
    }
  };

  const handleNextStep = () => {
    narration.cancel();
    setPresenterStepIndex((prev) => Math.min(prev + 1, PRESENTER_SCRIPT.length - 1));
  };

  const handlePrevStep = () => {
    narration.cancel();
    setPresenterStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleExitDemo = () => {
    narration.cancel();
    setIsPresenterMode(false);
  };

  return {
    isPresenterMode,
    presenterStepIndex,
    isPlaying,
    speed,
    narration,
    startGuidedDemo,
    handleTogglePlay,
    handleNextStep,
    handlePrevStep,
    handleExitDemo,
    setSpeed,
  };
}
