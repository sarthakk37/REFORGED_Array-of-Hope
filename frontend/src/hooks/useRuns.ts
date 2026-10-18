// React Query hook to fetch the list of recent drift remediation runs.
// Polls actively while runs are in progress and supports manual invalidation.

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { Run } from '@/api/types';

export function useRuns() {
  return useQuery<Run[], Error>({
    queryKey: ['runs'],
    queryFn: () => api.getRuns(),
    refetchInterval: (query) => {
      // Auto-poll every 3 seconds if any run is currently running or queued
      const hasActiveRun = query.state.data?.some(
        (r) => r.status === 'running' || r.status === 'queued'
      );
      return hasActiveRun ? 3000 : 15000;
    },
  });
}
