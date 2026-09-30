import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSession } from '@/hooks/use-auth';
import { getApiClient } from '@/lib/api';
import { DEFAULT_HISTORY_LIMIT } from '@/lib/api/schemas/profile';
import { unwrap } from '@/lib/api/unwrap';
import { HISTORY_QUERY_KEY, PROFILE_QUERY_KEY } from '@/lib/query-keys';

// Keyed by user, so a new identity never sees old numbers
function useUserId(): string | null {
  return useSession().data?.user.id ?? null;
}

export function useProfile() {
  const userId = useUserId();
  return useQuery({
    queryKey: [...PROFILE_QUERY_KEY, userId],
    queryFn: async () => unwrap(await getApiClient().profile.getProfile()),
    enabled: userId !== null,
  });
}

export function useHistory() {
  const userId = useUserId();
  return useInfiniteQuery({
    queryKey: [...HISTORY_QUERY_KEY, userId],
    queryFn: async ({ pageParam }) =>
      unwrap(
        await getApiClient().profile.getHistory({
          cursor: pageParam,
          limit: DEFAULT_HISTORY_LIMIT,
        }),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    enabled: userId !== null,
  });
}
