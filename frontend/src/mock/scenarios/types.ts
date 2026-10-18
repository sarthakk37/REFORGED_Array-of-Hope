// Scenario type definitions for DriftSmith API change simulations.

import { DriftReport, PatchInfo, Scenario } from '@/api/types';

export interface DriftScenarioData {
  scenario: Scenario;
  title: string;
  technicalName: string;
  description: string;
  plainCaption: string;
  diffPlainCaption: string;
  oldPayloadJson: string;
  newPayloadJson: string;
  driftReport: DriftReport;
  patch: PatchInfo;
}
