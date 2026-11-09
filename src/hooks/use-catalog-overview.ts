import { queryOptions, useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { unwrap } from '@/lib/api/unwrap';

export const CATALOG_OVERVIEW_QUERY_KEY = ['catalog-overview'] as const;

// The catalog only changes on ingestion
const CATALOG_OVERVIEW_STALE_TIME_MS = 60 * 60_000;

export const catalogOverviewQuery = queryOptions({
  queryKey: CATALOG_OVERVIEW_QUERY_KEY,
  queryFn: async () => unwrap(await getApiClient().catalog.getOverview()),
  staleTime: CATALOG_OVERVIEW_STALE_TIME_MS,
});

export function useCatalogOverview() {
  return useQuery(catalogOverviewQuery);
}
