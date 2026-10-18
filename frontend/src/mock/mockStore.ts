// Central single in-memory state store for DriftSmith mock mode.
// Ensures consistent metrics, single-source pattern retention, and deterministic demo runs.

import { RunDetail, LearnedPattern, HealthResponse, Scenario } from '@/api/types';
import { INITIAL_MOCK_RUNS } from './runs';
import { INITIAL_MOCK_PATTERNS } from './patterns';
import { MOCK_HEALTH } from './health';
import { DRIFT_SCENARIOS } from './drifts';

class MockStore {
  private runs: RunDetail[] = [...INITIAL_MOCK_RUNS];
  private patterns: LearnedPattern[] = [...INITIAL_MOCK_PATTERNS];
  private health: HealthResponse = { ...MOCK_HEALTH };

  getRuns(): RunDetail[] {
    return [...this.runs];
  }

  getRun(id: string): RunDetail | undefined {
    return this.runs.find((r) => r.id === id);
  }

  addRun(run: RunDetail): void {
    this.runs.unshift(run);
  }

  updateRun(id: string, updates: Partial<RunDetail>): RunDetail | undefined {
    const idx = this.runs.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.runs[idx] = { ...this.runs[idx], ...updates };
    return this.runs[idx];
  }

  getPatterns(): LearnedPattern[] {
    return [...this.patterns];
  }

  hasPatternForScenario(scenario: Scenario): boolean {
    const scenarioData = DRIFT_SCENARIOS[scenario];
    if (!scenarioData) return false;
    return this.patterns.some((p) => p.fingerprint === scenarioData.driftReport.fingerprint);
  }

  addRememberedFix(scenario: Scenario): LearnedPattern {
    const scenarioData = DRIFT_SCENARIOS[scenario];
    const existing = this.patterns.find((p) => p.fingerprint === scenarioData.driftReport.fingerprint);
    if (existing) {
      return existing;
    }

    const newPattern: LearnedPattern = {
      id: `pat-${Date.now().toString().slice(-3)}`,
      fingerprint: scenarioData.driftReport.fingerprint,
      summary: `When a provider alters ${scenarioData.title.toLowerCase()}, apply the safe fix automatically.`,
      times_used: 0,
      created_at: new Date().toISOString(),
    };

    this.patterns.unshift(newPattern);
    return newPattern;
  }

  incrementPatternUsage(fingerprint: string): void {
    const pat = this.patterns.find((p) => p.fingerprint === fingerprint);
    if (pat) {
      pat.times_used += 1;
    }
  }

  getHealth(): HealthResponse {
    return { ...this.health };
  }

  /**
   * Unified metrics derived strictly from the single store.
   * All pages and components consume these exact computed numbers.
   */
  getMetrics() {
    const totalFixes = this.runs.length;
    const timesUsedTotal = this.patterns.reduce((sum, p) => sum + p.times_used, 0);
    // Consistent rule: 4 AI calls saved per remembered fix application
    const totalAiCallsSaved = timesUsedTotal * 4;

    const successfulRuns = this.runs.filter(
      (r) => r.verified || r.status === 'approved' || r.status === 'awaiting_approval'
    ).length;

    const verifiedRate = totalFixes > 0 ? Math.round((successfulRuns / totalFixes) * 100) : 100;

    return {
      totalFixes,
      timesUsedTotal,
      totalAiCallsSaved,
      verifiedRate,
    };
  }

  resetToInitial(): void {
    this.runs = [...INITIAL_MOCK_RUNS];
    this.patterns = [...INITIAL_MOCK_PATTERNS];
    this.health = { ...MOCK_HEALTH };
  }
}

export const mockStore = new MockStore();
