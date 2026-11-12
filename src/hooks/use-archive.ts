import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { unwrap } from '@/lib/api/unwrap';
import type { ArchiveQuery } from '@/types/catalog';

export const ARCHIVE_QUERY_KEY = ['archive'] as const;

// The backend keeps its index for 5 minutes
const ARCHIVE_STALE_TIME_MS = 5 * 60_000;

// Null while locked or loading: no request
export function useArchive(query: ArchiveQuery | null) {
  return useInfiniteQuery({
    queryKey: [...ARCHIVE_QUERY_KEY, query],
    queryFn: async ({ pageParam }) =>
      unwrap(
        await getApiClient().catalog.getArchive({
          ...query,
          ...(pageParam ? { cursor: pageParam } : {}),
        }),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    enabled: query !== null,
    // The last results stay while a new search loads
    placeholderData: keepPreviousData,
    staleTime: ARCHIVE_STALE_TIME_MS,
  });
}
