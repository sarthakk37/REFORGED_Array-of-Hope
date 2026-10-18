// Presenter Mode overlay providing automated hands-free walkthrough with 20px+ captions.
// Controls pause/play, step skipping, 1x/2x speed toggle, and automated stage progression.

import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  X,
  FastForward,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PresenterStep {
  title: string;
  caption: string;
  actionHint?: string;
}

export const PRESENTER_STEPS: PresenterStep[] = [
  {
    title: "1. Meet Priya's payment app",
    caption: "Meet Priya's payment app. It processes thousands of customer orders daily by reading transaction data from an external payment provider.",
  },
  {
    title: '2. The provider changes their API without warning',
    caption: 'The payment provider silently changes their API: prices are now sent as decimal strings in rupees ("499.00") instead of integer paise (49900). Priya\'s app crashes.',
  },
  {
    title: '3. DriftSmith diagnoses the exact break',
    caption: 'DriftSmith intercepts the failure immediately. The Detector and Investigator pinpoint the exact schema difference and locate the failing lines in services/payment_webhook.py.',
  },
  {
    title: '4. Code written & Reviewer catches a bug',
    caption: 'The Code writer drafts a fix. But on the first safe test run, the Reviewer catches a floating-point precision error and explains the exact rounding correction needed.',
  },
  {
    title: '5. Safe test room passes old AND new data',
    caption: 'The Code writer corrects the fix. In the safe test room, the new code passes tests against BOTH the legacy payload and the new payload with zero regressions.',
  },
  {
    title: '6. Ready for human sign-off',
    caption: 'DriftSmith keeps humans in the loop. One click approves the verified fix and prepares a pull request preview with complete safety notes for Priya\'s team.',
    actionHint: 'Approving fix and preparing Pull Request...',
  },
  {
    title: '7. Second app has the same problem: Instant memory fix!',
    caption: 'Now, a second team\'s app hits the exact same API change. DriftSmith remembers the verified recipe from earlier — fixing the issue instantly in ~5 seconds with 0 AI calls!',
  },
  {
    title: '8. Demonstration Summary',
    caption: 'First fix: ~22s, 4 AI calls. Second app: ~5s, 0 AI calls. DriftSmith turns breaking third-party API changes into automatic, human-approved pull requests.',
  },
];

export interface PresenterOverlayProps {
  currentStepIndex: number;
  isPlaying: boolean;
  speed: 1 | 2;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleSpeed: () => void;
  onExit: () => void;
}

export const PresenterOverlay: React.FC<PresenterOverlayProps> = ({
  currentStepIndex,
  isPlaying,
  speed,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleSpeed,
  onExit,
}) => {
  const currentStep = PRESENTER_STEPS[currentStepIndex] || PRESENTER_STEPS[0];
  const isFinalStep = currentStepIndex === PRESENTER_STEPS.length - 1;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
      <div
        data-testid="presenter-overlay"
        className="max-w-4xl mx-auto rounded-2xl border-2 border-forge-amber/60 bg-forge-surface/95 backdrop-blur-xl p-6 sm:p-7 shadow-2xl pointer-events-auto space-y-5"
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-forge-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-forge-amber animate-ping" />
            <span className="font-mono text-xs uppercase tracking-wider text-forge-amber-light font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Presenter Mode ({currentStepIndex + 1} of {PRESENTER_STEPS.length})
            </span>
          </div>

          {/* Player Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSpeed}
              className="px-2.5 py-1 rounded bg-forge-surface-elevated hover:bg-forge-surface text-xs font-mono font-semibold text-gray-300 border border-forge-border flex items-center gap-1"
              title="Toggle playback speed"
            >
              <FastForward className="w-3 h-3 text-forge-amber" />
              <span>{speed}x speed</span>
            </button>

            <button
              onClick={onTogglePlay}
              className="p-1.5 rounded-lg bg-forge-surface-elevated hover:bg-forge-surface text-white border border-forge-border"
              title={isPlaying ? 'Pause' : 'Resume'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-forge-amber" />}
            </button>

            <button
              onClick={onNext}
              disabled={isFinalStep}
              className="p-1.5 rounded-lg bg-forge-surface-elevated hover:bg-forge-surface text-white border border-forge-border disabled:opacity-40"
              title="Next step"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={onExit}
              className="p-1.5 rounded-lg bg-forge-surface-elevated hover:bg-rose-950/40 text-gray-400 hover:text-white border border-forge-border ml-2"
              title="Exit Presenter Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big High-Contrast Caption (20px+) */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-gray-400">
            {currentStep.title}
          </div>
          <p className="text-lg sm:text-2xl font-semibold text-white leading-snug tracking-tight font-sans">
            "{currentStep.caption}"
          </p>
        </div>

        {/* Special Summary Card on final step */}
        {isFinalStep && (
          <div className="p-4 rounded-xl border border-forge-green/40 bg-forge-green/10 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-forge-amber flex-shrink-0" />
              <div className="text-xs font-mono">
                <span className="font-bold text-white block text-sm">Autonomous Drift Remediation Proven</span>
                <span className="text-gray-300">
                  First fix: ~22s, 4 AI calls • Second app (memory): ~5s, 0 AI calls
                </span>
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={onExit} className="text-xs font-mono">
              Close Guided Demo
            </Button>
          </div>
        )}

        {/* Step dots navigation */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {PRESENTER_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'w-8 bg-forge-amber'
                    : idx < currentStepIndex
                    ? 'w-2 bg-forge-green'
                    : 'w-2 bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <Button variant="ghost" size="sm" onClick={onPrev} className="text-xs">
                Back
              </Button>
            )}
            {!isFinalStep ? (
              <Button variant="primary" size="sm" onClick={onNext} className="text-xs font-bold">
                Next Step
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onExit} className="text-xs font-bold">
                Finish Demo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
