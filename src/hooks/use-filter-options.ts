import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { unwrap } from '@/lib/api/unwrap';

export const FILTER_OPTIONS_QUERY_KEY = ['filter-options'] as const;

// The catalog only changes on ingestion
const FILTER_OPTIONS_STALE_TIME_MS = 60 * 60_000;

export function useFilterOptions() {
  return useQuery({
    queryKey: FILTER_OPTIONS_QUERY_KEY,
    queryFn: async () =>
      unwrap(await getApiClient().catalog.getFilterOptions()),
    staleTime: FILTER_OPTIONS_STALE_TIME_MS,
  });
}
