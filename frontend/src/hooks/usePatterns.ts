// React Query hook to fetch learned drift patterns for zero-LLM remediation.
// Used by the LearnedPatternsPage and dashboard statistics.

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { LearnedPattern } from '@/api/types';

export function usePatterns() {
  return useQuery<LearnedPattern[], Error>({
    queryKey: ['patterns'],
    queryFn: () => api.getPatterns(),
  });
}
