// Unit tests for mockStore consistency, single-source-of-truth metrics, and memory heal rules.

import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore } from '@/mock/mockStore';

describe('mock/mockStore', () => {
  beforeEach(() => {
    mockStore.resetToInitial();
  });

  it('maintains consistent metrics across all calculations', () => {
    const patterns = mockStore.getPatterns();
    const metrics = mockStore.getMetrics();

    const expectedTimesUsed = patterns.reduce((sum, p) => sum + p.times_used, 0);
    const expectedAiSaved = expectedTimesUsed * 4;

    expect(metrics.timesUsedTotal).toBe(expectedTimesUsed);
    expect(metrics.totalAiCallsSaved).toBe(expectedAiSaved);
    expect(metrics.totalFixes).toBe(mockStore.getRuns().length);
  });

  it('strictly adheres to memory-heal ordering rule', () => {
    // 1. Initial state: Only rename and nested are seeded; type format is NOT remembered yet
    expect(mockStore.hasPatternForScenario('rename')).toBe(true);
    expect(mockStore.hasPatternForScenario('nested')).toBe(true);
    expect(mockStore.hasPatternForScenario('type')).toBe(false);

    // 2. Add remembered fix for 'type' after first successful completion
    mockStore.addRememberedFix('type');

    // 3. Now type scenario is remembered and Second payment app can heal instantly!
    expect(mockStore.hasPatternForScenario('type')).toBe(true);

    const patterns = mockStore.getPatterns();
    const typePattern = patterns.find((p) => p.fingerprint === 'fp_type_amount_str_decimal_44c1');
    expect(typePattern).toBeDefined();
    expect(typePattern?.times_used).toBe(0);

    // 4. Increment usage when Second app uses it
    mockStore.incrementPatternUsage('fp_type_amount_str_decimal_44c1');
    expect(typePattern?.times_used).toBe(1);

    // 5. Metrics update consistently
    const updatedMetrics = mockStore.getMetrics();
    expect(updatedMetrics.totalAiCallsSaved).toBe(patterns.reduce((sum, p) => sum + p.times_used * 4, 0));
  });
});
