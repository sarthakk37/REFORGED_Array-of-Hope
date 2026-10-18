// Mutation hook to trigger a simulated or live API drift incident.
// Creates a new run and invalidates the runs list in the cache.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { TriggerDriftRequest, TriggerDriftResponse } from '@/api/types';

export function useTriggerDrift() {
  const queryClient = useQueryClient();

  return useMutation<TriggerDriftResponse, Error, TriggerDriftRequest>({
    mutationFn: (request) => api.triggerDrift(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}
