// Type definitions for mock stream event templates.

import { RunEvent } from '@/api/types';

export interface EventStepTemplate {
  agent: RunEvent['agent'];
  friendlyRole: string;
  kind: RunEvent['kind'];
  message: string;
  delayMs: number;
  storyStep: number; // 1: API changed, 2: Problem found, 3: Fix written, 4: Fix tested, 5: Ready for approval
  isRetry?: boolean;
  technicalDetails?: Record<string, unknown>;
}
