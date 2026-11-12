import { queryOptions, useQuery } from '@tanstack/react-query';
import { useSession } from '@/hooks/use-auth';
import { getApiClient } from '@/lib/api';
import { unwrap } from '@/lib/api/unwrap';
import { proAccess } from '@/lib/pro';
import type { ProAccess } from '@/types/pro';

export const APP_CONFIG_QUERY_KEY = ['app-config'] as const;

// The backend's own max-age for /config
const APP_CONFIG_STALE_TIME_MS = 5 * 60_000;

const appConfigQuery = queryOptions({
  queryKey: APP_CONFIG_QUERY_KEY,
  queryFn: async () => unwrap(await getApiClient().config.getConfig()),
  staleTime: APP_CONFIG_STALE_TIME_MS,
});

export function useAppConfig() {
  return useQuery(appConfigQuery);
}

export function useProAccess(): ProAccess {
  const config = useAppConfig();
  const session = useSession();
  // A session still loading must not flash a lock
  if (session.isPending) return 'pending';
  return proAccess(config.data ?? null, session.data?.user ?? null);
}
