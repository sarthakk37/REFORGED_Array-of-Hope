// React Query hook to fetch backend health status and integration states.
// Used by SystemStatusPage and top-level connectivity banners.

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { HealthResponse } from '@/api/types';

export function useHealth() {
  return useQuery<HealthResponse, Error>({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
    retry: 1,
    refetchInterval: 30000,
  });
}
