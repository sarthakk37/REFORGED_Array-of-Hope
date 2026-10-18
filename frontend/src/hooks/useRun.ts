// React Query hook to fetch detailed run information by ID.
// Includes drift report, unified diff patch, sandbox logs, and pull request data.

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { RunDetail } from '@/api/types';

export function useRun(id: string | undefined) {
  return useQuery<RunDetail, Error>({
    queryKey: ['run', id],
    queryFn: () => {
      if (!id) throw new Error('Run ID is required');
      return api.getRun(id);
    },
    enabled: Boolean(id),
    refetchInterval: (query) => {
      // Auto-refresh running runs until they finish
      const status = query.state.data?.status;
      return status === 'running' || status === 'queued' ? 2500 : false;
    },
  });
}
