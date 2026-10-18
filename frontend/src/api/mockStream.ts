// Timer-based simulated EventStream implementation for mock mode.
// Replays realistic multi-agent sequences (sentinel, triage, locator, coder, critic, verifier, pr, system).

import { EventStream, EventStreamOptions, EventStreamSubscription } from './eventStream';
import { RunEvent, Scenario } from './types';
import { buildFreshRunSequence, buildMemoryHealedSequence, EventStepTemplate } from '@/mock/events';

// In-memory registry to determine if a run is memory-healed and its scenario
interface MockRunStreamMetadata {
  scenario: Scenario;
  isMemoryHealed: boolean;
  fingerprint: string;
}

const runStreamMetadata = new Map<string, MockRunStreamMetadata>();

export function registerMockRunForStream(
  runId: string,
  scenario: Scenario,
  isMemoryHealed: boolean,
  fingerprint = 'fp_default_stream'
): void {
  runStreamMetadata.set(runId, { scenario, isMemoryHealed, fingerprint });
}

export function getMockRunSequence(
  scenario: Scenario,
  isMemoryHealed: boolean,
  fingerprint = 'fp_default'
): EventStepTemplate[] {
  if (isMemoryHealed) {
    return buildMemoryHealedSequence(fingerprint);
  }
  return buildFreshRunSequence(scenario);
}

export class MockStream implements EventStream {
  subscribe(options: EventStreamOptions): EventStreamSubscription {
    const { runId, onEvent, onFinished } = options;
    const meta = runStreamMetadata.get(runId) || {
      scenario: 'rename',
      isMemoryHealed: false,
      fingerprint: 'fp_rename_amount_in_cents_9b2e',
    };

    const steps = getMockRunSequence(meta.scenario, meta.isMemoryHealed, meta.fingerprint);
    let stepIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isClosed = false;

    const scheduleNext = () => {
      if (isClosed || stepIndex >= steps.length) {
        if (!isClosed && stepIndex >= steps.length) {
          onFinished?.();
        }
        return;
      }

      const currentStep = steps[stepIndex];
      const seq = stepIndex + 1;

      timeoutId = setTimeout(() => {
        if (isClosed) return;

        const event: RunEvent = {
          id: `evt-${runId}-${seq}`,
          run_id: runId,
          seq,
          agent: currentStep.agent,
          kind: currentStep.kind,
          message: currentStep.message,
          payload: currentStep.payload || null,
          created_at: new Date().toISOString(),
        };

        onEvent(event);
        stepIndex++;

        if (currentStep.message === 'run_finished') {
          onFinished?.();
        } else {
          scheduleNext();
        }
      }, currentStep.delayMs);
    };

    // Kick off sequence
    scheduleNext();

    return {
      close: () => {
        isClosed = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      },
    };
  }
}

export const mockStream = new MockStream();
