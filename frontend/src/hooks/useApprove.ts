// Mutation hook to approve a verified patch and open a Pull Request.
// Updates run status to approved and invalidates run queries.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { ApproveResponse } from '@/api/types';

export function useApprove() {
  const queryClient = useQueryClient();

  return useMutation<ApproveResponse, Error, string>({
    mutationFn: (runId: string) => api.approveRun(runId),
    onSuccess: (_, runId) => {
      queryClient.invalidateQueries({ queryKey: ['run', runId] });
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}
