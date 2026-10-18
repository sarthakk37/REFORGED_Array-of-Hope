// Real Server-Sent Events (SSE) stream implementation using fetch ReadableStream.
// Injects Authorization Bearer token into headers and parses JSON RunEvent messages.

import { EventStream, EventStreamOptions, EventStreamSubscription } from './eventStream';
import { RunEvent } from './types';
import { tokenStorage } from '@/auth/tokenStorage';
import { config } from '@/config/env';

export class SseStream implements EventStream {
  subscribe(options: EventStreamOptions): EventStreamSubscription {
    const { runId, onEvent, onError, onFinished } = options;
    const abortController = new AbortController();
    let isClosed = false;

    const startStream = async () => {
      try {
        const token = tokenStorage.getToken();
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const url = `${config.apiUrl}/api/runs/${encodeURIComponent(runId)}/events`;
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`SSE request failed with status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported or empty response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!isClosed) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          // Retain incomplete trailing chunk
          buffer = lines.pop() || '';

          for (const block of lines) {
            if (!block.trim()) continue;
            const messageLines = block.split('\n');
            for (const line of messageLines) {
              if (line.startsWith('data:')) {
                const jsonStr = line.substring(5).trim();
                try {
                  const event = JSON.parse(jsonStr) as RunEvent;
                  onEvent(event);
                  if (event.agent === 'system' && event.message === 'run_finished') {
                    onFinished?.();
                    return;
                  }
                } catch (parseErr) {
                  console.warn('Failed to parse SSE JSON payload', parseErr, jsonStr);
                }
              }
            }
          }
        }

        if (!isClosed) {
          onFinished?.();
        }
      } catch (err: unknown) {
        if (!isClosed && (err as Error)?.name !== 'AbortError') {
          console.error('SSE Stream error occurred', err);
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    startStream();

    return {
      close: () => {
        isClosed = true;
        abortController.abort();
      },
    };
  }
}

export const sseStream = new SseStream();
