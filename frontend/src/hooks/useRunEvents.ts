// Custom hook to subscribe to real-time RunEvents via EventStream.
// Maintains progressive timeline events, thinking indicators, and stream termination.

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { stream } from '@/api';
import { RunEvent } from '@/api/types';

export function useRunEvents(runId: string | undefined, isFinishedInitially = false) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(!isFinishedInitially);
  const [isFinished, setIsFinished] = useState<boolean>(isFinishedInitially);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!runId) return;

    // Reset state for new runId
    setEvents([]);
    setIsFinished(isFinishedInitially);
    setIsStreaming(!isFinishedInitially);
    setError(null);

    // If run is already completed in history, we still populate initial events or connect
    const subscription = stream.subscribe({
      runId,
      onEvent: (event: RunEvent) => {
        setEvents((prev) => {
          // Avoid duplicate events with same sequence
          if (prev.some((e) => e.seq === event.seq)) {
            return prev;
          }
          return [...prev, event];
        });
      },
      onError: (err: Error) => {
        setError(err);
        setIsStreaming(false);
      },
      onFinished: () => {
        setIsStreaming(false);
        setIsFinished(true);
        // Refresh run details in React Query cache to reflect finished status
        queryClient.invalidateQueries({ queryKey: ['run', runId] });
        queryClient.invalidateQueries({ queryKey: ['runs'] });
      },
    });

    return () => {
      subscription.close();
    };
  }, [runId, isFinishedInitially, queryClient]);

  return {
    events,
    isStreaming,
    isFinished,
    error,
  };
}
