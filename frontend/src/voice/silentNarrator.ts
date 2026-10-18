// Silent voice narrator that waits a realistic duration derived from text word count.
// Used as fallback when audio is disabled or speech synthesis is unavailable.

import { VoiceNarrator } from './narrator';

export class SilentNarrator implements VoiceNarrator {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private resolveFn: (() => void) | null = null;
  private remainingMs = 0;
  private startTime = 0;
  private isPausedState = false;

  isAvailable(): boolean {
    return true;
  }

  /**
   * Calculates realistic duration based on standard speaking cadence (~160 wpm, ~375ms/word).
   */
  calculateDurationMs(text: string, rate = 1.0): number {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const baseMs = Math.max(2500, words * 375);
    const effectiveRate = rate > 0 ? rate : 1.0;
    return Math.round(baseMs / effectiveRate);
  }

  speak(text: string, rate = 1.0): Promise<void> {
    this.cancel();
    const durationMs = this.calculateDurationMs(text, rate);
    this.remainingMs = durationMs;
    this.startTime = Date.now();
    this.isPausedState = false;

    return new Promise<void>((resolve) => {
      this.resolveFn = resolve;
      this.timer = setTimeout(() => {
        this.timer = null;
        this.resolveFn = null;
        resolve();
      }, durationMs);
    });
  }

  pause(): void {
    if (this.timer && !this.isPausedState) {
      clearTimeout(this.timer);
      this.timer = null;
      const elapsed = Date.now() - this.startTime;
      this.remainingMs = Math.max(0, this.remainingMs - elapsed);
      this.isPausedState = true;
    }
  }

  resume(): void {
    if (this.isPausedState && this.resolveFn && this.remainingMs > 0) {
      this.isPausedState = false;
      this.startTime = Date.now();
      this.timer = setTimeout(() => {
        this.timer = null;
        const res = this.resolveFn;
        this.resolveFn = null;
        if (res) res();
      }, this.remainingMs);
    }
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.resolveFn) {
      const res = this.resolveFn;
      this.resolveFn = null;
      res();
    }
    this.isPausedState = false;
    this.remainingMs = 0;
  }
}
