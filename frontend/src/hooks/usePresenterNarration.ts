// Hook managing spoken voice narration, browser voice list, volume, and mute states.
// Syncs playback rate with presenter speed and persists preferences in localStorage.

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceNarrator } from '@/voice/narrator';
import { SpeechSynthesisNarrator } from '@/voice/speechSynthesisNarrator';
import { AudioFileNarrator } from '@/voice/audioFileNarrator';
import { createVoiceNarrator } from '@/voice';

const STORAGE_MUTED = 'driftsmith_narration_muted';
const STORAGE_VOLUME = 'driftsmith_narration_volume';
const STORAGE_VOICE = 'driftsmith_narration_voice';

export function usePresenterNarration(speed: 1 | 2) {
  const narratorRef = useRef<VoiceNarrator | null>(null);

  const [isMuted, setIsMutedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_MUTED) === 'true';
    } catch {
      return false;
    }
  });

  const [volume, setVolumeState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_VOLUME);
      return stored ? parseFloat(stored) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoiceState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_VOICE) || '';
    } catch {
      return '';
    }
  });

  // Initialize narrator instance
  if (!narratorRef.current) {
    narratorRef.current = createVoiceNarrator();
  }

  // Load available speech synthesis voices if supported
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        if (!selectedVoice) {
          const indianVoice = voices.find((v) => v.lang.includes('en-IN'));
          const defaultVoice = indianVoice || voices.find((v) => v.lang.startsWith('en')) || voices[0];
          if (defaultVoice) {
            setSelectedVoiceState(defaultVoice.name);
          }
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoice]);

  // Sync volume and voice
  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    narratorRef.current?.setVolume?.(effectiveVolume);
    if (selectedVoice) {
      narratorRef.current?.setVoice?.(selectedVoice);
    }
  }, [isMuted, volume, selectedVoice]);

  const setMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    try {
      localStorage.setItem(STORAGE_MUTED, String(muted));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setVolume = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    try {
      localStorage.setItem(STORAGE_VOLUME, String(clamped));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setVoice = useCallback((voiceName: string) => {
    setSelectedVoiceState(voiceName);
    narratorRef.current?.setVoice?.(voiceName);
    try {
      localStorage.setItem(STORAGE_VOICE, voiceName);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const speak = useCallback(
    async (text: string, stepId?: string): Promise<void> => {
      if (!narratorRef.current) return;
      if (narratorRef.current instanceof AudioFileNarrator && stepId) {
        narratorRef.current.setStepId(stepId);
      }
      if (narratorRef.current instanceof SpeechSynthesisNarrator && selectedVoice) {
        narratorRef.current.setVoice(selectedVoice);
      }

      const rate = speed === 1 ? 1.0 : 1.5;
      await narratorRef.current.speak(text, rate);
    },
    [speed, selectedVoice]
  );

  const pause = useCallback(() => {
    narratorRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    narratorRef.current?.resume();
  }, []);

  const cancel = useCallback(() => {
    narratorRef.current?.cancel();
  }, []);

  return {
    narrator: narratorRef.current,
    isMuted,
    volume,
    availableVoices,
    selectedVoice,
    setMuted,
    setVolume,
    setVoice,
    speak,
    pause,
    resume,
    cancel,
  };
}
