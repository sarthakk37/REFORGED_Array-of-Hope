// Presenter Mode overlay providing automated hands-free walkthrough with voice audio controls.
// Displays high-contrast 20px+ captions and coordinates playback progression.

import React from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PRESENTER_SCRIPT } from '@/demo/script';
import { PresenterAudioControls } from './PresenterAudioControls';

export { PRESENTER_SCRIPT };

// Backward-compatible alias for existing tests
export const PRESENTER_STEPS = PRESENTER_SCRIPT.map((s) => ({
  title: s.title,
  caption: s.spokenText,
}));

export interface PresenterOverlayProps {
  currentStepIndex: number;
  isPlaying: boolean;
  speed: 1 | 2;
  isMuted?: boolean;
  volume?: number;
  availableVoices?: SpeechSynthesisVoice[];
  selectedVoice?: string;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleSpeed: () => void;
  onToggleMute?: () => void;
  onVolumeChange?: (val: number) => void;
  onVoiceChange?: (voiceName: string) => void;
  onExit: () => void;
}

export const PresenterOverlay: React.FC<PresenterOverlayProps> = ({
  currentStepIndex,
  isPlaying,
  speed,
  isMuted = false,
  volume = 1.0,
  availableVoices = [],
  selectedVoice = '',
  onTogglePlay,
  onNext,
  onPrev,
  onToggleSpeed,
  onToggleMute,
  onVolumeChange,
  onVoiceChange,
  onExit,
}) => {
  const currentStep = PRESENTER_SCRIPT[currentStepIndex] || PRESENTER_SCRIPT[0];
  const isFinalStep = currentStepIndex === PRESENTER_SCRIPT.length - 1;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
      <div
        data-testid="presenter-overlay"
        className="max-w-4xl mx-auto rounded-2xl border-2 border-forge-amber/60 bg-forge-surface/95 backdrop-blur-xl p-6 sm:p-7 shadow-2xl pointer-events-auto space-y-5"
      >
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-forge-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-forge-amber animate-ping" />
            <span className="font-mono text-xs uppercase tracking-wider text-forge-amber-light font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Presenter Mode ({currentStepIndex + 1} of {PRESENTER_SCRIPT.length})
            </span>
          </div>

          <PresenterAudioControls
            isPlaying={isPlaying}
            speed={speed}
            isMuted={isMuted}
            volume={volume}
            availableVoices={availableVoices}
            selectedVoice={selectedVoice}
            isFinalStep={isFinalStep}
            onTogglePlay={onTogglePlay}
            onNext={onNext}
            onToggleSpeed={onToggleSpeed}
            onToggleMute={onToggleMute}
            onVolumeChange={onVolumeChange}
            onVoiceChange={onVoiceChange}
            onExit={onExit}
          />
        </div>

        {/* Big High-Contrast Caption (20px+) */}
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-gray-400">
            {currentStep.title}
          </div>
          <p className="text-lg sm:text-2xl font-semibold text-white leading-snug tracking-tight font-sans">
            "{currentStep.spokenText}"
          </p>
        </div>

        {/* Special Summary Card on final step */}
        {isFinalStep && (
          <div
            data-testid="presenter-summary-card"
            className="p-4 rounded-xl border border-forge-green/40 bg-forge-green/10 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn"
          >
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
            {PRESENTER_SCRIPT.map((_, idx) => (
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
