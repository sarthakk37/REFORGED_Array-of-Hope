// Audio file narrator that plays recorded MP3 voice tracks from /public/narration/<stepId>.mp3.
// Falls back gracefully to SilentNarrator if audio file is not found or cannot be played.

import { VoiceNarrator } from './narrator';
import { SilentNarrator } from './silentNarrator';

export class AudioFileNarrator implements VoiceNarrator {
  private currentAudio: HTMLAudioElement | null = null;
  private fallbackNarrator = new SilentNarrator();
  private volume = 1.0;
  private stepId: string | null = null;

  isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.Audio !== 'undefined';
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  setStepId(stepId: string): void {
    this.stepId = stepId;
  }

  speak(text: string, rate = 1.0): Promise<void> {
    this.cancel();

    if (!this.isAvailable() || !this.stepId) {
      return this.fallbackNarrator.speak(text, rate);
    }

    const audioUrl = `/narration/${this.stepId}.mp3`;

    return new Promise<void>((resolve) => {
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      audio.volume = this.volume;
      audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));

      const cleanupAndResolve = () => {
        this.currentAudio = null;
        resolve();
      };

      audio.onended = cleanupAndResolve;
      audio.onerror = () => {
        // MP3 missing or load failed: seamless fallback to word cadence
        this.fallbackNarrator.speak(text, rate).then(cleanupAndResolve);
      };

      try {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            this.fallbackNarrator.speak(text, rate).then(cleanupAndResolve);
          });
        } else if (playPromise === undefined) {
          // Headless/jsdom environments where HTMLMediaElement play is not implemented
          this.fallbackNarrator.speak(text, rate).then(cleanupAndResolve);
        }
      } catch {
        this.fallbackNarrator.speak(text, rate).then(cleanupAndResolve);
      }
    });
  }

  pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    } else {
      this.fallbackNarrator.pause();
    }
  }

  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(() => {});
    } else {
      this.fallbackNarrator.resume();
    }
  }

  cancel(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.fallbackNarrator.cancel();
  }
}
