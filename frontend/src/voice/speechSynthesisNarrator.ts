// Speech synthesis narrator using browser Web Speech API (window.speechSynthesis).
// Handles voice selection (e.g. en-IN), speech rate adjustments, and safe event resolution.

import { VoiceNarrator } from './narrator';

export class SpeechSynthesisNarrator implements VoiceNarrator {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private selectedVoiceName: string | null = null;
  private volume = 1.0;
  private resolveFn: (() => void) | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setVoice(voiceName: string): void {
    this.selectedVoiceName = voiceName;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isAvailable()) return [];
    return window.speechSynthesis.getVoices();
  }

  findPreferredVoice(): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    if (voices.length === 0) return null;

    if (this.selectedVoiceName) {
      const match = voices.find((v) => v.name === this.selectedVoiceName);
      if (match) return match;
    }

    // Default to Indian English if available (Priya story)
    const indianVoice = voices.find((v) => v.lang.includes('en-IN'));
    if (indianVoice) return indianVoice;

    // Fall back to natural-sounding English voice
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
    );
    if (naturalVoice) return naturalVoice;

    return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
  }

  speak(text: string, rate = 1.0): Promise<void> {
    this.cancel();

    if (!this.isAvailable()) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.resolveFn = resolve;
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      utterance.rate = Math.max(0.5, Math.min(2.0, rate));
      utterance.volume = this.volume;

      const voice = this.findPreferredVoice();
      if (voice) {
        utterance.voice = voice;
      }

      const onComplete = () => {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
        if (this.resolveFn) {
          const fn = this.resolveFn;
          this.resolveFn = null;
          this.currentUtterance = null;
          fn();
        }
      };

      utterance.onend = onComplete;
      utterance.onerror = onComplete;

      // Chrome/Safari SpeechSynthesis freeze safety timeout
      const maxDurationMs = Math.max(4000, (text.split(' ').length * 600) / rate);
      this.timeoutId = setTimeout(() => {
        this.cancel();
      }, maxDurationMs);

      window.speechSynthesis.speak(utterance);
    });
  }

  pause(): void {
    if (this.isAvailable() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  resume(): void {
    if (this.isAvailable() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.isAvailable()) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    if (this.resolveFn) {
      const fn = this.resolveFn;
      this.resolveFn = null;
      fn();
    }
  }
}
