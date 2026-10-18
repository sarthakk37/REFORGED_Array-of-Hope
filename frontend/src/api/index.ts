// Central export for DriftSmith API layer.
// Dynamically selects mockClient or httpClient and mockStream or sseStream based on config.useMock.

import { config } from '@/config/env';
import { ApiClient } from './apiClient';
import { mockClient } from './mockClient';
import { httpClient } from './httpClient';
import { EventStream } from './eventStream';
import { mockStream } from './mockStream';
import { sseStream } from './sseStream';

export const api: ApiClient = config.useMock ? mockClient : httpClient;
export const stream: EventStream = config.useMock ? mockStream : sseStream;

export * from './types';
export * from './apiClient';
export * from './eventStream';
