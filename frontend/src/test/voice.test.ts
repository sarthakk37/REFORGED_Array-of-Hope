// Tests for voice narration system and guided demo script synchronization.
// Covers VoiceNarrator interface contracts, SilentNarrator timing, pause/resume, and fallbacks.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SilentNarrator } from '@/voice/silentNarrator';
import { SpeechSynthesisNarrator } from '@/voice/speechSynthesisNarrator';
import { AudioFileNarrator } from '@/voice/audioFileNarrator';
import { createVoiceNarrator } from '@/voice';
import { PRESENTER_SCRIPT } from '@/demo/script';

describe('voice/SilentNarrator', () => {
  it('calculates duration proportional to word count and minimum floor', () => {
    const narrator = new SilentNarrator();

    // Very short text gets minimum duration floor (2500ms at 1x)
    const shortDuration = narrator.calculateDurationMs('Hello world.', 1.0);
    expect(shortDuration).toBe(2500);

    // Longer text (~20 words -> 20 * 375 = 7500ms)
    const longText =
      'Meet Priya payment app. It processes thousands of customer orders daily by reading transaction data from an external provider.';
    const longDuration = narrator.calculateDurationMs(longText, 1.0);
    expect(longDuration).toBeGreaterThan(5000);

    // 2x speed reduces duration by half
    const speed2xDuration = narrator.calculateDurationMs(longText, 2.0);
    expect(speed2xDuration).toBe(Math.round(longDuration / 2));
  });

  it('resolves speak promise after calculated duration and supports cancel', async () => {
    vi.useFakeTimers();
    const narrator = new SilentNarrator();

    let finished = false;
    narrator.speak('Short text test', 1.0).then(() => {
      finished = true;
    });

    expect(finished).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(finished).toBe(false);

    narrator.cancel();
    await Promise.resolve();
    expect(finished).toBe(true);

    vi.useRealTimers();
  });

  it('supports pause and resume during silent timing', async () => {
    vi.useFakeTimers();
    const narrator = new SilentNarrator();

    let finished = false;
    narrator.speak('A relatively longer sentence for pause and resume test verification.', 1.0).then(() => {
      finished = true;
    });

    vi.advanceTimersByTime(1000);
    narrator.pause();

    vi.advanceTimersByTime(5000);
    await Promise.resolve();
    expect(finished).toBe(false);

    narrator.resume();
    vi.advanceTimersByTime(10000);
    await Promise.resolve();
    expect(finished).toBe(true);

    vi.useRealTimers();
  });
});

describe('voice/SpeechSynthesisNarrator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('gracefully reports availability based on window.speechSynthesis', () => {
    const narrator = new SpeechSynthesisNarrator();
    // In default jsdom, speechSynthesis is undefined unless mocked
    expect(typeof narrator.isAvailable()).toBe('boolean');
  });

  it('falls back cleanly when speechSynthesis is unavailable in headless runtime', async () => {
    const narrator = new SpeechSynthesisNarrator();
    // speak resolves without throwing
    await expect(narrator.speak('Test sentence')).resolves.toBeUndefined();
  });
});

describe('voice/AudioFileNarrator', () => {
  it('falls back to word count timing if Audio playback is rejected or file missing', async () => {
    const narrator = new AudioFileNarrator();
    narrator.setStepId('intro-priya');

    // Should complete without unhandled exception
    await expect(narrator.speak('Fallback test sentence', 2.0)).resolves.toBeUndefined();
  });
});

describe('voice/createVoiceNarrator', () => {
  it('instantiates available voice narrator matching environment configuration', () => {
    const narrator = createVoiceNarrator();
    expect(narrator).toBeDefined();
    expect(typeof narrator.speak).toBe('function');
    expect(typeof narrator.cancel).toBe('function');
    expect(typeof narrator.isAvailable).toBe('function');
  });
});

describe('demo/script PRESENTER_SCRIPT', () => {
  it('defines 8 sequential narrative steps with spoken text and visual triggers', () => {
    expect(PRESENTER_SCRIPT).toHaveLength(8);

    expect(PRESENTER_SCRIPT[0].stepId).toBe('intro-priya');
    expect(PRESENTER_SCRIPT[0].spokenText).toContain("Priya's payment app");

    expect(PRESENTER_SCRIPT[1].visualAction).toBe('trigger-type-payment-app');
    expect(PRESENTER_SCRIPT[5].visualAction).toBe('approve-active-run');
    expect(PRESENTER_SCRIPT[6].visualAction).toBe('trigger-type-second-app');
    expect(PRESENTER_SCRIPT[7].stepId).toBe('summary-comparison');
  });
});
