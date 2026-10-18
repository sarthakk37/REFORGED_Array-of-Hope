// Player and audio controls toolbar for the presenter overlay.
// Supports speed toggle, voice dropdown, mute/unmute, and volume adjustment.

import React from 'react';
import { Play, Pause, SkipForward, X, FastForward, Volume2, VolumeX } from 'lucide-react';

export interface PresenterAudioControlsProps {
  isPlaying: boolean;
  speed: 1 | 2;
  isMuted: boolean;
  volume: number;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: string;
  isFinalStep: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onToggleSpeed: () => void;
  onToggleMute?: () => void;
  onVolumeChange?: (val: number) => void;
  onVoiceChange?: (voiceName: string) => void;
  onExit: () => void;
}

export const PresenterAudioControls: React.FC<PresenterAudioControlsProps> = ({
  isPlaying,
  speed,
  isMuted,
  volume,
  availableVoices,
  selectedVoice,
  isFinalStep,
  onTogglePlay,
  onNext,
  onToggleSpeed,
  onToggleMute,
  onVolumeChange,
  onVoiceChange,
  onExit,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Browser Voice Selector */}
      {availableVoices.length > 0 && onVoiceChange && (
        <select
          aria-label="Select voice"
          value={selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value)}
          className="text-[11px] font-mono bg-forge-bg border border-forge-border text-gray-300 rounded px-2 py-1 max-w-[140px] truncate focus:outline-none focus:ring-1 focus:ring-forge-amber"
        >
          {availableVoices
            .filter((v) => v.lang.startsWith('en'))
            .map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
        </select>
      )}

      {/* Mute Button */}
      {onToggleMute && (
        <button
          type="button"
          onClick={onToggleMute}
          className="p-1.5 rounded-lg bg-forge-surface-elevated hover:bg-forge-surface text-gray-300 hover:text-white border border-forge-border"
          title={isMuted ? 'Unmute narration' : 'Mute narration'}
          aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-forge-green" />}
        </button>
      )}

      {/* Volume Slider */}
      {!isMuted && onVolumeChange && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-16 accent-forge-amber h-1.5 bg-gray-700 rounded-lg cursor-pointer"
          title="Narration volume"
          aria-label="Narration volume"
        />
      )}

      {/* Speed Toggle */}
      <button
        onClick={onToggleSpeed}
        className="px-2.5 py-1 rounded bg-forge-surface-elevated hover:bg-forge-surface text-xs font-mono font-semibold text-gray-300 border border-forge-border flex items-center gap-1"
        title="Toggle playback speed"
      >
        <FastForward className="w-3 h-3 text-forge-amber" />
        <span>{speed}x speed</span>
      </button>

      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        className="p-1.5 rounded-lg bg-forge-surface-elevated hover:bg-forge-surface text-white border border-forge-border"
        title={isPlaying ? 'Pause' : 'Resume'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-forge-amber" />}
      </button>

      {/* Next Step */}
      <button
        onClick={onNext}
        disabled={isFinalStep}
        className="p-1.5 rounded-lg bg-forge-surface-elevated hover:bg-forge-surface text-white border border-forge-border disabled:opacity-40"
        title="Next step"
      >
        <SkipForward className="w-4 h-4" />
      </button>

      {/* Exit */}
      <button
        onClick={onExit}
        className="p-1.5 rounded-lg bg-forge-surface-elevated hover:bg-rose-950/40 text-gray-400 hover:text-white border border-forge-border ml-1"
        title="Exit Presenter Mode"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
