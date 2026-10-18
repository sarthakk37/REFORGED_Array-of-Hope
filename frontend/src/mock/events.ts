// Plain-English event timeline fixtures and step definitions for DriftSmith runs.
// Agents are presented with friendly roles: Detector, Investigator, Code writer, Reviewer, Tester, Reporter.

import { Scenario } from '@/api/types';
import { EventStepTemplate } from './events/types';
import { typeEvents } from './events/typeEvents';
import { renameEvents } from './events/renameEvents';
import { nestedEvents } from './events/nestedEvents';

export * from './events/types';
export { buildMemoryHealedSequence } from './events/memoryHealEvents';

/**
 * Builds the event progression sequence for a fresh run (~20-22 seconds total).
 */
export function buildFreshRunSequence(scenario: Scenario): EventStepTemplate[] {
  if (scenario === 'type') {
    return typeEvents;
  }
  if (scenario === 'rename') {
    return renameEvents;
  }
  return nestedEvents;
}
