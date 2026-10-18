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
      // Auto-poll every ~4s if any run is currently running or queued, back to ~15s when idle
      const hasActiveRun = query.state.data?.some(
        (r) => r.status === 'running' || r.status === 'queued'
      );
      return hasActiveRun ? 4000 : 15000;
    },
  });
}
