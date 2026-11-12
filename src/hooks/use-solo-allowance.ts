import {
  type QueryClient,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';
import { useSession } from '@/hooks/use-auth';
import { getApiClient } from '@/lib/api';
import { unwrap } from '@/lib/api/unwrap';
import { SOLO_ALLOWANCE_QUERY_KEY } from '@/lib/query-keys';
import { refetchAtReset } from '@/lib/solo-allowance';

// Keyed by user: a new guest sees no old count
export function soloAllowanceQuery(userId: string | null) {
  return queryOptions({
    queryKey: [...SOLO_ALLOWANCE_QUERY_KEY, userId],
    queryFn: async () => unwrap(await getApiClient().solo.getAllowance()),
  });
}

export function useSoloAllowance() {
  const userId = useSession().data?.user.id ?? null;
  return useQuery({
    ...soloAllowanceQuery(userId),
    enabled: userId !== null,
    refetchInterval: (query) =>
      refetchAtReset(query.state.data ?? null, Date.now()),
  });
}

// After a side pick, a run's end or a refusal
export function refreshSoloAllowance(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: SOLO_ALLOWANCE_QUERY_KEY });
}
