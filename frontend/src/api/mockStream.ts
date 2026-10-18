// Timer-based simulated EventStream implementation for mock mode.
// Replays realistic multi-agent sequences with plain-English friendly roles and story step trackers.

import { EventStream, EventStreamOptions, EventStreamSubscription } from './eventStream';
import { RunEvent, Scenario } from './types';
import { buildFreshRunSequence, buildMemoryHealedSequence, EventStepTemplate } from '@/mock/events';

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
      scenario: 'type',
      isMemoryHealed: false,
      fingerprint: 'fp_type_amount_str_decimal_44c1',
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
          payload: {
            friendlyRole: currentStep.friendlyRole,
            storyStep: currentStep.storyStep,
            isRetry: Boolean(currentStep.isRetry),
            ...(currentStep.technicalDetails || {}),
          },
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
