// Central registry for the 3 demo API change scenarios.
// Aggregates Price format changed, Field renamed, and Email moved fixtures.

import { Scenario } from '@/api/types';
import { DriftScenarioData } from './scenarios/types';
import { typeScenario } from './scenarios/typeScenario';
import { renameScenario } from './scenarios/renameScenario';
import { nestedScenario } from './scenarios/nestedScenario';

export * from './scenarios/types';

export const DRIFT_SCENARIOS: Record<Scenario, DriftScenarioData> = {
  type: typeScenario,
  rename: renameScenario,
  nested: nestedScenario,
};
