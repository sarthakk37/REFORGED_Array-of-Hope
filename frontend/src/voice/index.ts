// Central factory for VoiceNarrator instances.
// Selects SpeechSynthesisNarrator, AudioFileNarrator, or SilentNarrator based on VITE_NARRATION.

import { config } from '@/config/env';
import { VoiceNarrator } from './narrator';
import { SpeechSynthesisNarrator } from './speechSynthesisNarrator';
import { AudioFileNarrator } from './audioFileNarrator';
import { SilentNarrator } from './silentNarrator';

export function createVoiceNarrator(): VoiceNarrator {
  if (config.narration === 'off') {
    return new SilentNarrator();
  }

  if (config.narration === 'audio') {
    return new AudioFileNarrator();
  }

  // Default to speech synthesis
  const speechNarrator = new SpeechSynthesisNarrator();
  if (speechNarrator.isAvailable()) {
    return speechNarrator;
  }

  // Automatic fallback when browser speech synthesis is unsupported
  return new SilentNarrator();
}

export * from './narrator';
export * from './speechSynthesisNarrator';
export * from './audioFileNarrator';
export * from './silentNarrator';
