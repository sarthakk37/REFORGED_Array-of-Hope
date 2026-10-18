// EventStream interface for real-time RunEvent streaming.
// Implemented by sseStream.ts for real backend and mockStream.ts for client-side demo runs.

import { RunEvent } from './types';

export interface EventStreamOptions {
  runId: string;
  onEvent: (event: RunEvent) => void;
  onError?: (error: Error) => void;
  onFinished?: () => void;
}

export interface EventStreamSubscription {
  close: () => void;
}

export interface EventStream {
  subscribe(options: EventStreamOptions): EventStreamSubscription;
}
